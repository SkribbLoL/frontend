import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../HomePage';
import config from '../../config';

// Mock the fetch function
global.fetch = vi.fn();
// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the homepage correctly', () => {
    render(<HomePage />);
    
    // Check main elements
    expect(screen.getByText('SkribbLoL')).toBeInTheDocument();
    expect(screen.getByText('Draw and guess League of Legends champions!')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Nickname')).toBeInTheDocument();
    expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
    expect(screen.getByText('Create New Room')).toBeInTheDocument();
    expect(screen.getByText('Join Room')).toBeInTheDocument();
  });

  it('shows error when trying to create room without nickname', async () => {
    render(<HomePage />);
    
    // Try to create room without entering nickname
    fireEvent.click(screen.getByText('Create New Room'));
    
    // Check if error message is displayed
    expect(screen.getByText('Please enter a nickname')).toBeInTheDocument();
  });

  it('shows error when trying to join room without nickname or room code', async () => {
    render(<HomePage />);
    
    // Try to join room without entering nickname or room code
    fireEvent.click(screen.getByText('Join Room'));
    
    // Check if error message is displayed
    expect(screen.getByText('Please enter a nickname')).toBeInTheDocument();
    
    // Enter nickname but not room code
    fireEvent.change(screen.getByLabelText('Your Nickname'), { target: { value: 'TestUser' } });
    fireEvent.click(screen.getByText('Join Room'));
    
    // Check if error message is displayed
    expect(screen.getByText('Please enter a room code')).toBeInTheDocument();
  });

  it('creates a room successfully', async () => {
    // Mock successful response for createRoom
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roomCode: 'ABC123', userId: 'user123' })
    });
    
    render(<HomePage />);
    
    // Enter nickname
    fireEvent.change(screen.getByLabelText('Your Nickname'), { target: { value: 'TestUser' } });
    
    // Click create room button
    fireEvent.click(screen.getByText('Create New Room'));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.api.baseUrl}/rooms`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ nickname: 'TestUser' })
        })
      );
      expect(window.location.href).toBe('/room/ABC123?userId=user123');
    });
  });

  it('joins a room successfully', async () => {
    // Mock successful response for joinRoom
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user456' })
    });
    
    render(<HomePage />);
    
    // Enter nickname and room code
    fireEvent.change(screen.getByLabelText('Your Nickname'), { target: { value: 'TestUser' } });
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'XYZ789' } });
    
    // Click join room button
    fireEvent.click(screen.getByText('Join Room'));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.api.baseUrl}/rooms/XYZ789/join`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ nickname: 'TestUser' })
        })
      );
      expect(window.location.href).toBe('/room/XYZ789?userId=user456');
    });
  });

  it('handles errors when creating a room', async () => {
    // Mock error response
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' })
    });
    
    render(<HomePage />);
    
    // Enter nickname
    fireEvent.change(screen.getByLabelText('Your Nickname'), { target: { value: 'TestUser' } });
    
    // Click create room button
    fireEvent.click(screen.getByText('Create New Room'));
    
    // Wait for the API call to complete and error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
}); 
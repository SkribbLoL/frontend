import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomPage from '../RoomPage';
import config from '../../config';

// Import socket.io-client module
import * as socketIOClient from 'socket.io-client';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ roomCode: 'TEST123' }),
  useLocation: () => ({ 
    search: '?userId=user123' 
  })
}));

// Setup event handlers map
const eventHandlers: Record<string, (data: unknown) => void> = {};

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const socketMock = {
    on: vi.fn((event, callback) => {
      eventHandlers[event] = callback;
      return socketMock;
    }),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  };
  
  return { 
    io: vi.fn(() => socketMock)
  };
});

// Helper to trigger socket events
const triggerSocketEvent = (event: string, data: unknown) => {
  if (eventHandlers[event]) {
    eventHandlers[event](data);
  }
};

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn()
  }
});

// Mock window.location
const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: '' }
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation
  });
});

describe('RoomPage', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    // Clear event handlers
    Object.keys(eventHandlers).forEach(key => delete eventHandlers[key]);
  });
  
  it('connects to socket and joins the room on load', async () => {
    // Render the component
    render(<RoomPage />);
    
    // Wait for socket.io connection setup
    await waitFor(() => {
      expect(socketIOClient.io).toHaveBeenCalledWith(config.api.wsUrl);
    });
    
    // Simulate socket 'connect' event
    triggerSocketEvent('connect', {});
    
    // Get the emit mock
    const socketMock = (socketIOClient.io as unknown as Mock)();
    
    // Check if join-room event was emitted with correct data
    expect(socketMock.emit).toHaveBeenCalledWith('join-room', { 
      roomCode: 'TEST123', 
      userId: 'user123' 
    });
    
    // Verify loading state is shown
    expect(screen.getByText('Connecting to room...')).toBeInTheDocument();
  });
  
  it('displays room information after joining', async () => {
    render(<RoomPage />);
    
    // Simulate socket connected
    triggerSocketEvent('connect', {});
    
    // Simulate room joined event with mock data
    const mockRoomData = {
      room: {
        users: [
          { id: 'user123', nickname: 'TestUser', isHost: true, score: 0, joinedAt: Date.now() },
          { id: 'user456', nickname: 'Player2', isHost: false, score: 0, joinedAt: Date.now() }
        ],
        createdAt: Date.now(),
        gameStarted: false,
        rounds: 3,
        currentRound: 0,
        currentDrawer: null
      }
    };
    
    triggerSocketEvent('room-joined', mockRoomData);
    
    // Verify room information is displayed
    await waitFor(() => {
      expect(screen.getByText('Room: TEST123')).toBeInTheDocument();
      expect(screen.getByText('TestUser')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
    });
  });
  
  it('handles copy room code button click', async () => {
    render(<RoomPage />);
    
    // Setup socket and room data
    triggerSocketEvent('connect', {});
    triggerSocketEvent('room-joined', {
      room: {
        users: [{ id: 'user123', nickname: 'TestUser', isHost: true, score: 0, joinedAt: Date.now() }],
        createdAt: Date.now(),
        gameStarted: false,
        rounds: 3,
        currentRound: 0,
        currentDrawer: null
      }
    });
    
    // Wait for the room page to load
    await waitFor(() => {
      expect(screen.getByText('Invite friends:')).toBeInTheDocument();
    });
    
    // Click copy button
    const copyButton = screen.getByText('Copy Code');
    fireEvent.click(copyButton);
    
    // Verify clipboard API was called with room code
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TEST123');
    
    // Verify success message appears
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
  
  it('shows error when starting game with less than 2 players', async () => {
    render(<RoomPage />);
    
    // Setup socket and room data with only one player
    triggerSocketEvent('connect', {});
    triggerSocketEvent('room-joined', {
      room: {
        users: [{ id: 'user123', nickname: 'TestUser', isHost: true, score: 0, joinedAt: Date.now() }],
        createdAt: Date.now(),
        gameStarted: false,
        rounds: 3,
        currentRound: 0,
        currentDrawer: null
      }
    });
    
    // Wait for the start game button to be visible
    await waitFor(() => {
      expect(screen.getByText('Start Game')).toBeInTheDocument();
    });
    
    // Click start game button
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Verify error message is shown
    expect(screen.getByText('Need at least 2 players to start the game')).toBeInTheDocument();
  });
  
  it('emits start-game event when start button is clicked with enough players', async () => {
    render(<RoomPage />);
    
    // Setup socket and room data with two players
    triggerSocketEvent('connect', {});
    triggerSocketEvent('room-joined', {
      room: {
        users: [
          { id: 'user123', nickname: 'TestUser', isHost: true, score: 0, joinedAt: Date.now() },
          { id: 'user456', nickname: 'Player2', isHost: false, score: 0, joinedAt: Date.now() }
        ],
        createdAt: Date.now(),
        gameStarted: false,
        rounds: 3,
        currentRound: 0,
        currentDrawer: null
      }
    });
    
    // Wait for the start game button to be visible
    await waitFor(() => {
      expect(screen.getByText('Start Game')).toBeInTheDocument();
    });
    
    // Click start game button
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Get the socket mock
    const socketMock = (socketIOClient.io as unknown as Mock)();
    
    // Verify start-game event was emitted with correct data
    expect(socketMock.emit).toHaveBeenCalledWith('start-game', {
      rounds: config.game.defaultRounds
    });
  });
}); 
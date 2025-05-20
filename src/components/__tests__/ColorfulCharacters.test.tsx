import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ColorfulCharacters from '../ColorfulCharacters';

describe('ColorfulCharacters', () => {
  it('renders all characters', () => {
    render(<ColorfulCharacters />);
    
    // The component should render 8 characters
    const characterElements = document.querySelectorAll('[style*="background-color"]');
    expect(characterElements.length).toBe(8);
  });

  it('renders with correct styles', () => {
    render(<ColorfulCharacters />);
    
    // Check that each character has the expected styling classes
    const characterElements = document.querySelectorAll('[style*="background-color"]');
    characterElements.forEach(element => {
      expect(element).toHaveClass('mx-1');
      expect(element).toHaveClass('flex');
      expect(element).toHaveClass('items-center');
      expect(element).toHaveClass('justify-center');
      expect(element).toHaveClass('rounded-full');
      expect(element).toHaveClass('text-2xl');
    });
  });

  it('renders emoji faces', () => {
    render(<ColorfulCharacters />);
    
    // Check for at least one of the emojis that should be rendered
    expect(screen.getByText('😊')).toBeInTheDocument();
  });
}); 
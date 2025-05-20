/**
 * Application configuration
 */

// Determine if we're in a Docker environment or local development
const isProduction = process.env.NODE_ENV === 'production';

// Configuration object
const config = {
  // API endpoints
  api: {
    // In Docker, services communicate using their service names
    // For local development, use localhost
    baseUrl: isProduction ? 'http://game-service:5000' : 'http://localhost:5000',
    
    // WebSocket URL for real-time communication
    wsUrl: isProduction ? 'http://game-service:5000' : 'http://localhost:5000',
    
    // Other service URLs
    drawingService: isProduction ? 'http://drawing-service:5001' : 'http://localhost:5001',
    chatService: isProduction ? 'http://chat-service:5002' : 'http://localhost:5002',
  },
  
  // Game settings
  game: {
    defaultRounds: 3,
    turnDuration: 60, // seconds
    maxPlayers: 10,
  }
};

export default config; 
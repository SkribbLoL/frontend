/**
 * Application configuration
 */

// Simple NodePort configuration - direct access to services
const config = {
  // API endpoints
  api: {
    // Direct NodePort access - no port forwarding needed
    baseUrl: 'http://localhost:30000',
    wsUrl: 'http://localhost:30000',
    drawingService: 'http://localhost:30001',
    chatService: 'http://localhost:30002',
  },
  
  // Game settings
  game: {
    defaultRounds: 3,
    turnDuration: 60, // seconds
    maxPlayers: 10,
  }
};

export default config; 
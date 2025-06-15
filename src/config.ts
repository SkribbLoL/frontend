/**
 * Application configuration
 */

// Docker Compose configuration - direct service communication
const config = {
  // API endpoints
  api: {
    // For Docker Compose, services are exposed on different ports
    baseUrl: `http://localhost:5000`,
    wsUrl: `http://localhost:5000`,
    drawingService: `http://localhost:5001`,
    chatService: `http://localhost:5002`,
  },
  
  // Game settings
  game: {
    defaultRounds: 3,
    turnDuration: 60, // seconds
    maxPlayers: 10,
  }
};

export default config; 
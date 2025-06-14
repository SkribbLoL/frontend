/**
 * Application configuration
 */

// Traefik ingress configuration - path-based routing
const config = {
  // API endpoints
  api: {
    // Traefik ingress paths - all through localhost with path prefixes
    baseUrl: 'http://localhost/game',
    wsUrl: 'ws://localhost/game',
    drawingService: 'http://localhost/drawing',
    chatService: 'http://localhost/chat',
  },
  
  // Game settings
  game: {
    defaultRounds: 3,
    turnDuration: 60, // seconds
    maxPlayers: 10,
  }
};

export default config; 
/**
 * Application configuration
 */

// Kubernetes/Production configuration - Traefik ingress routing
const config = {
  // API endpoints
  api: {
    // For Kubernetes, services are accessed through ingress routes
    baseUrl: `http://localhost/game`,
    wsUrl: `ws://localhost/game`, // Game service websocket
    drawingService: `http://localhost/drawing`,
    // chatService: `http://localhost/chat/socket.io/`, // Chat service websocket with full path
    chatService: `ws://localhost/chat/socket.io/`, // Chat service websocket with full path
  },
  
  // Docker Compose configuration - direct service communication
  // Uncomment below and comment above for Docker Compose usage
  /*
  api: {
    // For Docker Compose, services are exposed on different ports
    baseUrl: `http://localhost:5000`,
    wsUrl: `http://localhost:5000`,
    drawingService: `http://localhost:5001`,
    chatService: `http://localhost:5002`,
  },
  */
  
  // Game settings
  game: {
    defaultRounds: 3,
    turnDuration: 60, // seconds
    maxPlayers: 10,
  }
};

export default config; 
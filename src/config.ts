/**
 * Application configuration
 */

// Docker Compose configuration - direct service communication
const config = {
  api: {
    // For Docker Compose, services are exposed on different ports
    baseUrl: `http://localhost:5000`,
    wsUrl: `http://localhost:5000`,
    drawingService: `http://localhost:5001`,
    chatService: `http://localhost:5002`,
  },
  
  // Kubernetes/Production configuration - Traefik ingress routing
  // Uncomment below and comment above for Kubernetes usage
  /*
  api: {
    // For Kubernetes, services are accessed through ingress routes
    baseUrl: `http://localhost/game`,
    wsUrl: `http://localhost/game`,
    drawingService: `http://localhost/drawing`,
    chatService: `http://localhost/chat`,
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
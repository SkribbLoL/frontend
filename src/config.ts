/**
 * Application configuration
 */

// Kubernetes/Production configuration - Traefik ingress routing

/**
 * Application configuration
 */

// Kubernetes/Production configuration - Traefik ingress routing
const config = {
  // API endpoints
  api: {
    // For Kubernetes, services are accessed through ingress routes
    baseUrl: `http://localhost/game`,
    wsUrl: {
      url: `http://localhost/game`,
      path: `/game/socket.io/`,
      namespace: '/game'
    }, // Game service websocket
    drawingService: {
      url: `http://localhost/drawing`,
      path: `/drawing/socket.io/`,
      namespace: '/drawing'
    },
    // Fixed chat service configuration for Socket.IO
    chatService: {
      url: `http://localhost`, // Base URL without /chat
      path: `/chat/socket.io/`, // Socket.IO path with namespace prefix
      namespace: '/chat' // Namespace for Socket.IO
    }
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
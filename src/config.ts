
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
    baseUrl: `http://${process.env.VITE_API_URL}/game`,
    wsUrl: {
      url: `http://${process.env.VITE_API_URL}`, // Base URL without /game prefix for Socket.IO
      path: `/game/socket.io/`, // Full path including /game prefix
      namespace: '/game'
    },
    drawingService: {
      url: `http://${process.env.VITE_API_URL}`, // Base URL without /drawing prefix
      path: `/drawing/socket.io/`, // Full path including /drawing prefix
      namespace: '/drawing'
    },
    // Fixed chat service configuration for Socket.IO
    chatService: {
      url: `http://${process.env.VITE_API_URL}`, // Base URL without /chat
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
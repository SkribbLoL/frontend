/**
 * Application configuration
 */

const config = {
  // API endpoints
  api: {
    // For Kubernetes, services are accessed through ingress routes
    baseUrl: `http://34.91.143.99/game`,
    wsUrl: {
      url: `http://34.91.143.99`,
      path: `/game/socket.io/`,
      namespace: '/game'
    },
    drawingService: {
      url: `http://34.91.143.99`,
      path: `/drawing/socket.io/`,
      namespace: '/drawing'
    },
    // Fixed chat service configuration for Socket.IO
    chatService: {
      url: `http://34.91.143.99`,
      path: `/chat/socket.io/`,
      namespace: '/chat' // Namespace for Socket.IO
    }
  },
  
  // Game settings
  game: {
    defaultRounds: 3,
    turnDuration: 60, // seconds
    maxPlayers: 10,
  }
};

export default config;
/**
 * Application configuration
 */

const config = {
  // API endpoints
  api: {
    // For Kubernetes, services are accessed through ingress routes
    baseUrl: `http://veljkoskrbic.com/game`,
    wsUrl: {
      url: `http://veljkoskrbic.com`,
      path: `/game/socket.io/`,
      namespace: '/game'
    },
    drawingService: {
      url: `http://veljkoskrbic.com`,
      path: `/drawing/socket.io/`,
      namespace: '/drawing'
    },
    // Fixed chat service configuration for Socket.IO
    chatService: {
      url: `http://veljkoskrbic.com`,
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
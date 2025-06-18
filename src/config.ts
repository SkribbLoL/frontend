/**
 * Application configuration
 */

const config = {
  // API endpoints
  api: {
    // For Kubernetes, services are accessed through ingress routes
    baseUrl: `${window.location.protocol}//${window.location.hostname}/game`,
    wsUrl: {
      url: `${window.location.protocol}//${window.location.hostname}`,
      path: `/game/socket.io/`,
      namespace: '/game'
    },
    drawingService: {
      url: `${window.location.protocol}//${window.location.hostname}`,
      path: `/drawing/socket.io/`,
      namespace: '/drawing'
    },
    // Fixed chat service configuration for Socket.IO
    chatService: {
      url: `${window.location.protocol}//${window.location.hostname}`,
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
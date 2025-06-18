import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from '../components/ui/button';
import DrawingCanvas from '../components/DrawingCanvas';
import Chat from '../components/Chat';
import RoomSettings, { GameSettings } from '../components/RoomSettings';
import config from '../config';

interface User {
  id: string;
  nickname: string;
  isHost: boolean;
  score: number;
  joinedAt: number;
}

interface Room {
  users: User[];
  createdAt: number;
  gameStarted: boolean;
  rounds: number;
  currentRound: number;
  currentDrawer: string | null;
  maxPlayers?: number;
  roundDuration?: number;
  gamePhase?: string;
  currentWord?: string;
  roundStartTime?: number;
  roundEndTime?: number;
}

interface SocketErrorData {
  message: string;
}

interface SocketRoomData {
  room: Room;
}

interface SocketUserData {
  users: User[];
  message: string;
}

const RoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const location = useLocation();
  const userId = new URLSearchParams(location.search).get('userId');
  
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string>('');
  const [isGameConnected, setIsGameConnected] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [startingGame, setStartingGame] = useState(false);
  const [gameStartError, setGameStartError] = useState<string>('');
  
  // Ref to track copy timeout
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Make sure roomCode and userId are available
    if (!roomCode || !userId) {
      setError('Room code or user ID is missing');
      return;
    }

    console.log('🔍 Connecting with config:', {
      gameUrl: `${config.api.wsUrl.url}${config.api.wsUrl.namespace}`,
      gamePath: config.api.wsUrl.path,
      chatUrl: `${config.api.chatService.url}${config.api.chatService.namespace}`,
      chatPath: config.api.chatService.path
    });

    // Initialize game socket
    console.log('🔗 Game socket connecting to:AKLSNFLKNASFNASN', `${config.api.wsUrl.url}${config.api.wsUrl.namespace}`);
    const gameSocketInstance = io(`${config.api.wsUrl.url}${config.api.wsUrl.namespace}`, {
      path: config.api.wsUrl.path,
      transports: ['polling', 'websocket'], // Enable both transports
      autoConnect: true,
      forceNew: true,
    });

    setGameSocket(gameSocketInstance);

    // Connect to chat service with correct Socket.IO syntax  
    const chatSocketInstance = io(`${config.api.chatService.url}${config.api.chatService.namespace}`, {
      path: config.api.chatService.path,
      transports: ['polling'], // Start with polling only for consistency
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });
    
    setChatSocket(chatSocketInstance);

    // Manually connect the sockets
    console.log('🚀 Manually connecting sockets...');
    gameSocketInstance.connect();
    chatSocketInstance.connect();

    // Game socket event listeners
    gameSocketInstance.on('connect', () => {
      console.log('✅ Connected to game service');
      console.log('Game socket ID:', gameSocketInstance.id);
      setIsGameConnected(true);
      
      // Join the game room
      console.log('🚀 Emitting join-room event with:', { roomCode, userId });
      gameSocketInstance.emit('join-room', { roomCode, userId });
    });

    gameSocketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from game service');
      setIsGameConnected(false);
    });

    gameSocketInstance.on('connect_error', (error) => {
      console.error('🔥 Game socket connection error:', error);
      console.error('🔥 Game socket error object:', JSON.stringify(error, null, 2));
    });

    gameSocketInstance.on('error', (data: SocketErrorData) => {
      console.error('🔥 Game socket error:', data.message);
      console.error('🔥 Game socket error data:', data);
      setError(data.message);
      setStartingGame(false);
    });

    gameSocketInstance.on('room-joined', (data: SocketRoomData) => {
      console.log('🎉 Room joined successfully:', data);
      setRoom(data.room);
    });

    gameSocketInstance.on('user-joined', (data: SocketUserData) => {
      console.log('User joined:', data);
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: data.users
        };
      });
    });

    gameSocketInstance.on('user-left', (data: SocketUserData) => {
      console.log('User left:', data);
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: data.users
        };
      });
    });

    gameSocketInstance.on('game-started', (data: SocketRoomData) => {
      console.log('Game started:', data);
      setRoom(data.room);
      setStartingGame(false);
    });

    gameSocketInstance.on('correct-guess', (data: {
      userId: string;
      username: string;
      word: string;
      points: number;
      totalScore: number;
      drawerPoints?: number;
      drawerScore?: number;
      message: string;
    }) => {
      console.log('Correct guess:', data);
      // Update both the guesser's and drawer's scores in the room state
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.map(user => {
            if (user.id === data.userId) {
              // Update guesser's score
              return { ...user, score: data.totalScore };
            } else if (user.id === prev.currentDrawer && data.drawerScore !== undefined) {
              // Update drawer's score
              return { ...user, score: data.drawerScore };
            }
            return user;
          })
        };
      });
    });

    gameSocketInstance.on('game-ended', (data: {
      room: Room;
      winner: { nickname: string; score: number };
      finalScores: Array<{ id: string; nickname: string; score: number }>;
      message: string;
    }) => {
      console.log('Game ended:', data);
      setRoom(data.room);
    });

    gameSocketInstance.on('new-round', (data: {
      room: Room;
      message: string;
    }) => {
      console.log('New round:', data);
      setRoom(data.room);
    });

    gameSocketInstance.on('game-restarted', (data: {
      room: Room;
      message: string;
    }) => {
      console.log('Game restarted:', data);
      setRoom(data.room);
      setGameStartError(''); // Clear any previous errors
    });

    // Add a catch-all event listener to see what events are being received
    gameSocketInstance.onAny((eventName, ...args) => {
      console.log('🎯 Game socket received event:', eventName, args);
    });

    // Chat socket event listeners
    chatSocketInstance.on('connect', () => {
      console.log('✅ Connected to chat service');
      console.log('Chat socket ID:', chatSocketInstance.id);
      setIsChatConnected(true);
      // Don't join chat room here - wait for room data to be available
    });

    chatSocketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from chat service');
      setIsChatConnected(false);
    });

    chatSocketInstance.on('connect_error', (error) => {
      console.error('🔥 Chat socket connection error:', error);
      console.error('🔥 Chat socket error object:', JSON.stringify(error, null, 2));
    });

    chatSocketInstance.on('error', (data: SocketErrorData) => {
      console.error('🔥 Chat socket error:', data.message);
      console.error('🔥 Chat socket error data:', data);
    });

    // Add a catch-all event listener for chat socket too
    chatSocketInstance.onAny((eventName, ...args) => {
      console.log('💬 Chat socket received event:', eventName, args);
    });

    // Clean up on unmount
    return () => {
      if (gameSocketInstance) {
        gameSocketInstance.off('connect');
        gameSocketInstance.off('disconnect');
        gameSocketInstance.off('error');
        gameSocketInstance.off('room-joined');
        gameSocketInstance.off('user-joined');
        gameSocketInstance.off('user-left');
        gameSocketInstance.off('game-started');
        gameSocketInstance.off('correct-guess');
        gameSocketInstance.off('game-ended');
        gameSocketInstance.off('new-round');
        gameSocketInstance.off('game-restarted');
        gameSocketInstance.disconnect();
      }
      
      if (chatSocketInstance) {
        chatSocketInstance.off('connect');
        chatSocketInstance.off('disconnect');
        chatSocketInstance.off('error');
        chatSocketInstance.disconnect();
      }
      
      // Clean up copy timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [roomCode, userId]);

  // Join chat room when room data is available
  useEffect(() => {
    console.log('🔍 Chat join effect triggered:', { 
      hasChatSocket: !!chatSocket, 
      hasRoom: !!room, 
      hasUserId: !!userId,
      roomCode 
    });
    
    if (chatSocket && room && userId) {
      const currentUser = room.users.find(user => user.id === userId);
      const username = currentUser?.nickname || 'Unknown';
      
      console.log('🚀 Emitting join-chat-room event with:', { roomCode, userId, username });
      chatSocket.emit('join-chat-room', { 
        roomCode, 
        userId, 
        username 
      });
    }
  }, [chatSocket, room, userId, roomCode]);

  const handleCopyRoomCode = async () => {
    if (!roomCode) {
      setCopySuccess('Error: No room code');
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      // Set new timeout
      copyTimeoutRef.current = setTimeout(() => setCopySuccess(''), 2000);
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomCode);
        setCopySuccess('Copied!');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopySuccess('Copied!');
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (err) {
      console.error('Failed to copy room code:', err);
      setCopySuccess('Copy failed');
      
      // Show the room code in an alert as last resort
      setTimeout(() => {
        alert(`Room code: ${roomCode}\n\nPlease copy this manually.`);
      }, 100);
    }
    
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    // Set new timeout to clear the message
    copyTimeoutRef.current = setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleLeaveRoom = () => {
    if (gameSocket) {
      gameSocket.emit('leave-room');
    }
    if (chatSocket) {
      chatSocket.emit('leave-chat-room');
    }
    window.location.href = '/';
  };

  const handleStartGame = (settings: GameSettings) => {
    if (!gameSocket || !room) return;
    
    setGameStartError('');
    setStartingGame(true);
    
    // Emit start game event with settings
    gameSocket.emit('start-game', {
      rounds: settings.rounds,
      maxPlayers: settings.maxPlayers,
      roundDuration: settings.roundDuration
    });
  };

  // Current user from the room data
  const currentUser = room?.users.find(user => user.id === userId);
  const currentUserNickname = currentUser?.nickname || 'Unknown';

  const isConnected = isGameConnected && isChatConnected;

  // Debug connection states
  console.log('🔍 Connection states:', {
    isGameConnected,
    isChatConnected,
    isConnected,
    hasRoom: !!room,
    roomCode,
    userId
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md border border-destructive/20">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="mt-2">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium">
            Connecting to services... 
            {isGameConnected ? '✅ Game' : '⏳ Game'} 
            {isChatConnected ? ' ✅ Chat' : ' ⏳ Chat'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="bg-card rounded-lg shadow-md mb-6 p-4 border border-border">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Room: {roomCode}</h1>
              <div className="flex items-center mt-2">
                <span className="text-sm text-muted-foreground mr-2">Invite friends:</span>
                <button
                  onClick={handleCopyRoomCode}
                  className={`px-3 py-1 text-sm rounded-md transition-all duration-200 flex items-center gap-1 ${
                    copySuccess === 'Copied!' 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : copySuccess?.includes('Error') || copySuccess?.includes('failed')
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border hover:border-primary'
                  }`}
                >
                  {copySuccess === 'Copied!' ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : copySuccess?.includes('Error') || copySuccess?.includes('failed') ? (
                    <>
                      <span>✗</span>
                      <span>{copySuccess}</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy Room Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Leave Room
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 h-[calc(100vh-200px)]">
          {/* Players Panel - Left Side */}
          <aside className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-md p-5 border border-border h-full">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center justify-between">
                <span>Players</span>
                <span className="text-sm font-normal text-muted-foreground">{room.users.length}/10</span>
              </h2>
              
              <div className="divide-y divide-border">
                {room.users.map((user) => (
                  <div 
                    key={user.id}
                    className={`py-3 flex items-center justify-between ${
                      user.id === userId ? 'bg-primary/5 -mx-2 px-2 rounded-md' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground font-medium ${
                        room.currentDrawer === user.id ? 'bg-green-500' : 'bg-primary'
                      }`}>
                        {user.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <span className="font-medium text-foreground">{user.nickname}</span>
                        {user.isHost && (
                          <span className="ml-2 text-xs text-primary font-medium">Host</span>
                        )}
                        {room.currentDrawer === user.id && (
                          <span className="ml-2 text-xs text-green-600 font-medium">Drawing</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{user.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Game controls - only show if user is host and game hasn't started */}
              {currentUser?.isHost && !room.gameStarted && (
                <div className="mt-6 p-4 bg-secondary rounded-lg border border-border text-center">
                  <p className="mb-4 text-secondary-foreground text-sm">Configure game settings to start playing.</p>
                  
                  {gameStartError && (
                    <div className="mb-4 p-3 bg-destructive/10 rounded text-sm text-destructive">
                      {gameStartError}
                    </div>
                  )}
                  
                  <RoomSettings
                    onStartGame={handleStartGame}
                    isStarting={startingGame}
                    minPlayers={2}
                    currentPlayers={room.users.length}
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Drawing Canvas - Center */}
          <main className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow-md p-5 border border-border h-full">
              <DrawingCanvas
                roomCode={roomCode!}
                userId={userId!}
                username={currentUserNickname}
                isGameStarted={room.gameStarted}
                currentDrawer={room.currentDrawer}
                users={room.users}
                socket={gameSocket}
                chatSocket={chatSocket}
                room={room}
              />
            </div>
          </main>

          {/* Chat Panel - Right Side */}
          <aside className="lg:col-span-1">
            <Chat
              roomCode={roomCode!}
              userId={userId!}
              username={currentUserNickname}
              isGameStarted={room.gameStarted}
              socket={chatSocket}
              gameSocket={gameSocket}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RoomPage; 
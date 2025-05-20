import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from '../components/ui/button';
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
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [startingGame, setStartingGame] = useState(false);
  const [gameStartError, setGameStartError] = useState<string>('');

  useEffect(() => {
    // Make sure roomCode and userId are available
    if (!roomCode || !userId) {
      setError('Room code or user ID is missing');
      return;
    }

    // Connect to socket.io server
    const socketInstance = io(config.api.wsUrl);
    setSocket(socketInstance);

    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Join the room
      socketInstance.emit('join-room', { roomCode, userId });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('error', (data: SocketErrorData) => {
      console.error('Socket error:', data.message);
      setError(data.message);
      setStartingGame(false);
    });

    socketInstance.on('room-joined', (data: SocketRoomData) => {
      console.log('Room joined:', data);
      setRoom(data.room);
    });

    socketInstance.on('user-joined', (data: SocketUserData) => {
      console.log('User joined:', data);
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: data.users
        };
      });
    });

    socketInstance.on('user-left', (data: SocketUserData) => {
      console.log('User left:', data);
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: data.users
        };
      });
    });

    socketInstance.on('game-started', (data: SocketRoomData) => {
      console.log('Game started:', data);
      setRoom(data.room);
      setStartingGame(false);
    });

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('error');
        socketInstance.off('room-joined');
        socketInstance.off('user-joined');
        socketInstance.off('user-left');
        socketInstance.off('game-started');
        socketInstance.disconnect();
      }
    };
  }, [roomCode, userId]);

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room');
      window.location.href = '/';
    }
  };

  const handleStartGame = () => {
    if (!socket || !room) return;
    
    // Check if there are enough players
    if (room.users.length < 2) {
      setGameStartError('Need at least 2 players to start the game');
      return;
    }

    setGameStartError('');
    setStartingGame(true);
    
    // Emit start game event
    socket.emit('start-game', {
      rounds: config.game.defaultRounds
    });
  };

  // Current user from the room data
  const currentUser = room?.users.find(user => user.id === userId);

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
          <p className="text-muted-foreground font-medium">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-card rounded-lg shadow-md mb-6 p-4 border border-border">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Room: {roomCode}</h1>
              <div className="flex items-center mt-2">
                <span className="text-sm text-muted-foreground mr-2">Invite friends:</span>
                <button
                  onClick={handleCopyRoomCode}
                  className="px-3 py-1 text-sm bg-secondary rounded-md hover:bg-secondary/80 transition-colors flex items-center"
                >
                  {copySuccess ? (
                    <span className="text-green-600">Copied!</span>
                  ) : (
                    <span>Copy Room Code</span>
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="md:col-span-1">
            <div className="bg-card rounded-lg shadow-md p-5 border border-border">
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
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                        {user.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <span className="font-medium text-foreground">{user.nickname}</span>
                        {user.isHost && (
                          <span className="ml-2 text-xs text-primary font-medium">Host</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{user.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="md:col-span-3">
            <div className="bg-card rounded-lg shadow-md p-5 border border-border">
              {room.gameStarted ? (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                  <p className="text-foreground">Game is in progress!</p>
                </div>
              ) : (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                  <p className="text-muted-foreground">Waiting for game to start...</p>
                </div>
              )}

              {currentUser?.isHost && !room.gameStarted && (
                <div className="mt-6 p-4 bg-secondary rounded-lg border border-border text-center">
                  <p className="mb-4 text-secondary-foreground">You are the host. Start the game when everyone is ready.</p>
                  
                  {gameStartError && (
                    <div className="mb-4 p-3 bg-destructive/10 rounded text-sm text-destructive">
                      {gameStartError}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleStartGame}
                    disabled={startingGame || room.users.length < 2} 
                    className="w-full max-w-xs py-5 text-base font-medium"
                  >
                    {startingGame ? 'Starting...' : 'Start Game'}
                  </Button>
                  
                  {room.users.length < 2 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      You need at least 2 players to start the game. Currently: {room.users.length}/2
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default RoomPage; 
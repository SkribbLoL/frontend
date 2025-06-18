import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/button';
import WordSelection from './WordSelection';
import Timer from './Timer';
import GameEndScreen from './GameEndScreen';
import config from '@/config';

interface DrawingCanvasProps {
  roomCode: string;
  userId: string;
  username: string;
  isGameStarted: boolean;
  currentDrawer: string | null;
  users: Array<{ id: string; nickname: string; isHost: boolean; score: number; joinedAt: number }>;
  socket: Socket | null;
  chatSocket?: Socket | null;
  room: {
    currentRound?: number;
    rounds?: number;
    roundEndTime?: number;
    roundDuration?: number;
    gamePhase?: string;
  } | null;
}

interface DrawingData {
  x: number;
  y: number;
  color: string;
  penSize: number;
}

interface DrawingEvent {
  type: string;
  x?: number;
  y?: number;
  color?: string;
  penSize?: number;
  userId?: string;
  timestamp?: number;
}

interface SocketErrorData {
  message: string;
}

interface CanvasStateData {
  drawings: DrawingEvent[];
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  roomCode,
  userId,
  username,
  isGameStarted,
  currentDrawer,
  users,
  socket,
  chatSocket,
  room
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingSocket, setDrawingSocket] = useState<Socket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentPenSize, setCurrentPenSize] = useState(5);
  const [isConnected, setIsConnected] = useState(false);
  const [canDraw, setCanDraw] = useState(false);
  
  // Game state
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordDisplay, setWordDisplay] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<string>('waiting'); // waiting, word-selection, drawing, round-end, game-end
  const [roundEndTime, setRoundEndTime] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number>(60);
  const [isLoadingNewRound, setIsLoadingNewRound] = useState(false);
  const [newRoundCountdown, setNewRoundCountdown] = useState(5);
  
  // Game end state
  const [gameEndData, setGameEndData] = useState<{
    winner: { nickname: string; score: number };
    winners?: Array<{ nickname: string; score: number }>;
    finalScores: Array<{ id: string; nickname: string; score: number }>;
  } | null>(null);

  // Get current drawer's nickname
  const currentDrawerNickname = users.find(user => user.id === currentDrawer)?.nickname || null;
  const currentUser = users.find(user => user.id === userId);

  // Sync local game phase with room game phase
  useEffect(() => {
    if (room?.gamePhase) {
      console.log('Syncing game phase from room:', room.gamePhase);
      setGamePhase(room.gamePhase);
    }
  }, [room?.gamePhase]);

  // Check if current user can draw
  useEffect(() => {
    setCanDraw(isGameStarted && currentDrawer === userId && gamePhase === 'drawing');
  }, [isGameStarted, currentDrawer, userId, gamePhase]);

  // Game socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleWordOptions = (data: { words: string[]; message: string }) => {
      console.log('Received word options:', data);
      setWordOptions(data.words);
      setShowWordSelection(true);
      setGamePhase('word-selection');
      setRoundEndTime(null); // Clear timer during word selection
    };

    const handleWordSelected = (data: { 
      room: {
        gameStarted: boolean;
        currentDrawer: string | null;
        gamePhase: string;
        roundEndTime?: number;
        roundDuration?: number;
        [key: string]: unknown;
      }; 
      wordDisplay: string; 
      roundDuration: number;
      roundEndTime?: number;
      message: string 
    }) => {
      console.log('Word selected:', data);
      setWordDisplay(data.wordDisplay);
      setGamePhase('drawing');
      setShowWordSelection(false);
      setRoundDuration(data.roundDuration);
      
      // Use round end time from server
      if (data.roundEndTime) {
        setRoundEndTime(data.roundEndTime);
      }
    };

    const handleDrawerWord = (data: { word: string; message: string }) => {
      console.log('Drawer word:', data);
      setCurrentWord(data.word);
    };

    const handleGameEnded = (data: {
      winner: { nickname: string; score: number };
      winners?: Array<{ nickname: string; score: number }>;
      finalScores: Array<{ id: string; nickname: string; score: number }>;
      message: string;
    }) => {
      console.log('Game ended event received:', data);
      setGamePhase('game-end');
      setGameEndData({
        winner: data.winner,
        winners: data.winners || [data.winner], // Use winners array if available, fallback to single winner
        finalScores: data.finalScores
      });
      setCurrentWord('');
      setWordDisplay('');
      setShowWordSelection(false);
      setRoundEndTime(null);
    };

    const handleNewRound = (data: {
      room: {
        currentRound: number;
        rounds: number;
        gamePhase: string;
        currentDrawer: string | null;
        [key: string]: unknown;
      };
      message: string;
    }) => {
      console.log('New round:', data);
      setGamePhase('word-selection');
      setCurrentWord('');
      setWordDisplay('');
      setShowWordSelection(false);
      setRoundEndTime(null);
      setIsLoadingNewRound(false); // Clear loading state when new round starts
    };

    const handleGameRestarted = (data: {
      room: {
        gameStarted: boolean;
        gamePhase: string;
        currentRound: number;
        rounds: number;
        currentDrawer: string | null;
        [key: string]: unknown;
      };
      message: string;
    }) => {
      console.log('Game restarted:', data);
      // Reset all local game state
      setGamePhase('waiting');
      setGameEndData(null);
      setCurrentWord('');
      setWordDisplay('');
      setShowWordSelection(false);
      setRoundEndTime(null);
      setWordOptions([]);
      setIsLoadingNewRound(false);
    };

    const handleCorrectGuess = (data: {
      userId: string;
      username: string;
      word: string;
      points: number;
      totalScore: number;
      message: string;
    }) => {
      console.log('Correct guess detected:', data);
      // Start loading new round state with countdown
      setIsLoadingNewRound(true);
      setNewRoundCountdown(5);
      setGamePhase('round-end');
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setNewRoundCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-hide after 5 seconds if new round hasn't started yet
      setTimeout(() => {
        setIsLoadingNewRound(false);
      }, 5500);
    };

    // Canvas clearing events from game service
    const handleClearCanvasRound = () => {
      console.log('Canvas cleared for new round');
      clearCanvas();
    };

    const handleClearCanvasGameEnd = () => {
      console.log('Canvas cleared for game end');
      clearCanvas();
    };

    socket.on('word-options', handleWordOptions);
    socket.on('word-selected', handleWordSelected);
    socket.on('drawer-word', handleDrawerWord);
    socket.on('game-ended', handleGameEnded);
    socket.on('new-round', handleNewRound);
    socket.on('game-restarted', handleGameRestarted);
    socket.on('correct-guess', handleCorrectGuess);
    socket.on('clear-canvas-round', handleClearCanvasRound);
    socket.on('clear-canvas-game-end', handleClearCanvasGameEnd);

    return () => {
      socket.off('word-options', handleWordOptions);
      socket.off('word-selected', handleWordSelected);
      socket.off('drawer-word', handleDrawerWord);
      socket.off('game-ended', handleGameEnded);
      socket.off('new-round', handleNewRound);
      socket.off('game-restarted', handleGameRestarted);
      socket.off('correct-guess', handleCorrectGuess);
      socket.off('clear-canvas-round', handleClearCanvasRound);
      socket.off('clear-canvas-game-end', handleClearCanvasGameEnd);
    };
  }, [socket]);

  // Initialize drawing socket connection
  useEffect(() => {
    if (!roomCode || !userId || !isGameStarted) return;

    console.log('🎨 Initializing drawing socket...');
    const drawingSocketInstance = io(`${config.api.drawingService.url}${config.api.drawingService.namespace}`, {
      path: config.api.drawingService.path,
      transports: ['polling', 'websocket'], // Enable both transports
      autoConnect: true,
      forceNew: true,
    });

    setDrawingSocket(drawingSocketInstance);

    drawingSocketInstance.on('connect', () => {
      console.log('Connected to drawing service');
      setIsConnected(true);
      
      // Join the drawing room
      drawingSocketInstance.emit('join-drawing-room', {
        roomCode,
        userId,
        username
      });
    });

    drawingSocketInstance.on('disconnect', () => {
      console.log('Disconnected from drawing service');
      setIsConnected(false);
    });

    drawingSocketInstance.on('error', (data: SocketErrorData) => {
      console.error('Drawing socket error:', data.message);
    });

    // Canvas state management
    drawingSocketInstance.on('canvas-state', (data: CanvasStateData) => {
      console.log('Received canvas state:', data);
      redrawCanvas(data.drawings);
    });

    drawingSocketInstance.on('canvas-cleared', () => {
      console.log('Canvas cleared');
      clearCanvas();
    });

    // Drawing events from other players
    drawingSocketInstance.on('draw-start', (data: DrawingData & { userId: string }) => {
      if (data.userId !== userId) {
        startRemoteDrawing(data);
      }
    });

    drawingSocketInstance.on('draw-move', (data: DrawingData & { userId: string }) => {
      if (data.userId !== userId) {
        continueRemoteDrawing(data);
      }
    });

    drawingSocketInstance.on('draw-end', (data: { userId: string }) => {
      if (data.userId !== userId) {
        endRemoteDrawing();
      }
    });

    return () => {
      drawingSocketInstance.disconnect();
    };
  }, [roomCode, userId, username, isGameStarted]);

  const getCanvas = useCallback(() => {
    return canvasRef.current;
  }, []);

  const getContext = useCallback(() => {
    const canvas = getCanvas();
    return canvas?.getContext('2d') || null;
  }, [getCanvas]);

  // Drawing functions
  const startRemoteDrawing = (data: DrawingData) => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(data.x, data.y);
  };

  const continueRemoteDrawing = (data: DrawingData) => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  };

  const endRemoteDrawing = () => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = getCanvas();
    const ctx = getContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const redrawCanvas = (drawings: DrawingEvent[]) => {
    if (!drawings || drawings.length === 0) return;
    
    clearCanvas();
    const ctx = getContext();
    if (!ctx) return;

    let currentPath = false;

    drawings.forEach(drawing => {
      if (drawing.type === 'clear-canvas') {
        clearCanvas();
        currentPath = false;
      } else if (drawing.type === 'draw-start') {
        // End previous path if it exists
        if (currentPath) {
          ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.strokeStyle = drawing.color || '#000000';
        ctx.lineWidth = drawing.penSize || 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(drawing.x || 0, drawing.y || 0);
        currentPath = true;
      } else if (drawing.type === 'draw-move' && currentPath) {
        ctx.lineTo(drawing.x || 0, drawing.y || 0);
        ctx.stroke();
      } else if (drawing.type === 'draw-end' && currentPath) {
        ctx.stroke();
        currentPath = false;
      }
    });

    // Ensure final stroke is applied
    if (currentPath) {
      ctx.stroke();
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingSocket || !isConnected) return;

    setIsDrawing(true);
    const canvas = getCanvas();
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return;

    // Calculate proper coordinates accounting for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Local drawing
    const ctx = getContext();
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentPenSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(x, y);
    }

    // Emit to server
    drawingSocket.emit('draw-start', {
      x,
      y,
      color: currentColor,
      penSize: currentPenSize
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw || !drawingSocket || !isConnected) return;

    const canvas = getCanvas();
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return;

    // Calculate proper coordinates accounting for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Local drawing
    const ctx = getContext();
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Emit to server
    drawingSocket.emit('draw-move', {
      x,
      y,
      color: currentColor,
      penSize: currentPenSize
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !canDraw || !drawingSocket) return;

    setIsDrawing(false);
    const ctx = getContext();
    if (ctx) {
      ctx.stroke();
    }

    // Emit to server
    drawingSocket.emit('draw-end', {});
  };

  const handleClearCanvas = () => {
    if (!drawingSocket || !canDraw) return;

    if (window.confirm('Are you sure you want to clear the canvas?')) {
      drawingSocket.emit('clear-canvas');
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentColor(e.target.value);
    if (drawingSocket) {
      drawingSocket.emit('change-color', { color: e.target.value });
    }
  };

  const handlePenSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value);
    setCurrentPenSize(size);
    if (drawingSocket) {
      drawingSocket.emit('change-pen-size', { size });
    }
  };

  const handleWordSelect = (selectedWord: string) => {
    if (socket) {
      socket.emit('select-word', { selectedWord });
      setShowWordSelection(false);
    }
  };

  const handleTimeUp = () => {
    // Notify server that time is up (optional - server has its own timer)
    if (socket) {
      socket.emit('end-round', { reason: 'time-up' });
    }
  };

  const handlePlayAgain = () => {
    if (socket) {
      // Emit restart game event to server instead of reloading page
      socket.emit('restart-game');
    }
  };

  const handleReturnToLobby = () => {
    // Properly leave both game and chat rooms before redirecting
    if (socket) {
      socket.emit('leave-room');
    }
    if (chatSocket) {
      chatSocket.emit('leave-chat-room');
    }
    
    // Small delay to ensure the leave events are sent before redirect
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Show loading new round screen when someone guessed correctly
  if (isLoadingNewRound) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 rounded-lg overflow-hidden flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
            Correct Guess!
          </h2>
          <p className="text-lg text-green-700 dark:text-green-300">
            Loading new round...
          </p>
          <div className="text-3xl font-bold text-green-800 dark:text-green-200">
            {newRoundCountdown}
          </div>
        </div>
      </div>
    );
  }

  // Show game end screen when game is over (check this first!)
  if (gamePhase === 'game-end' && gameEndData) {
    return (
      <GameEndScreen
        winner={gameEndData.winner}
        winners={gameEndData.winners}
        finalScores={gameEndData.finalScores}
        isHost={currentUser?.isHost || false}
        onPlayAgain={handlePlayAgain}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  if (!isGameStarted) {
    return (
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <p className="text-muted-foreground">Waiting for game to start...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Word Selection Modal */}
      <WordSelection
        words={wordOptions}
        onWordSelect={handleWordSelect}
        isVisible={showWordSelection && currentDrawer === userId}
      />

      {/* Round Info & Timer */}
      <div className="bg-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">
              Round {room?.currentRound || 1} of {room?.rounds || 1}
            </h3>
            <p className="text-sm text-muted-foreground">
              {gamePhase === 'word-selection' && currentDrawer === userId && 'Choose your word'}
              {gamePhase === 'word-selection' && currentDrawer !== userId && `${currentDrawerNickname} is choosing a word...`}
              {gamePhase === 'drawing' && currentDrawer === userId && 'Your turn to draw!'}
              {gamePhase === 'drawing' && currentDrawer !== userId && `${currentDrawerNickname} is drawing...`}
            </p>
          </div>
        </div>

        {/* Timer - only show during drawing phase */}
        {gamePhase === 'drawing' && roundEndTime && (
          <Timer
            endTime={roundEndTime}
            duration={roundDuration}
            onTimeUp={handleTimeUp}
          />
        )}

        {/* Word Display for Guessers */}
        {gamePhase === 'drawing' && currentDrawer !== userId && wordDisplay && (
          <div className="mt-3 text-center">
            <div className="text-2xl font-mono tracking-widest text-foreground bg-background px-6 py-3 rounded-lg border-2 border-border">
              {wordDisplay}
            </div>
          </div>
        )}

        {/* Drawer's Word */}
        {gamePhase === 'drawing' && currentDrawer === userId && currentWord && (
          <div className="mt-3 text-center">
            <div className="text-xl font-bold text-primary bg-primary/10 px-6 py-3 rounded-lg border-2 border-primary">
              Drawing: {currentWord}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative bg-white rounded-lg shadow-inner border-2 border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full ${canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Drawing tools - moved below canvas, only show if user can draw */}
      {canDraw && (
        <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-2">
            <label htmlFor="color" className="text-sm font-medium">Color:</label>
            <input
              id="color"
              type="color"
              value={currentColor}
              onChange={handleColorChange}
              className="w-8 h-8 rounded border-0 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="penSize" className="text-sm font-medium">Pen Size:</label>
            <input
              id="penSize"
              type="range"
              min="1"
              max="50"
              value={currentPenSize}
              onChange={handlePenSizeChange}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground w-6">{currentPenSize}</span>
          </div>
          
          <Button
            onClick={handleClearCanvas}
            variant="destructive"
            size="sm"
            className="ml-auto"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas; 
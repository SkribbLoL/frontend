import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from './ui/button';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system' | 'guess';
}

interface ChatProps {
  roomCode: string;
  userId: string;
  username: string;
  isGameStarted: boolean;
  socket: Socket | null;
}

const Chat: React.FC<ChatProps> = ({
  userId,
  isGameStarted,
  socket
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: 'system',
      username: 'System',
      message: 'Welcome to the chat!',
      timestamp: Date.now(),
      type: 'system'
    },
    {
      id: '2',
      userId: 'user1',
      username: 'Player1',
      message: 'Hello everyone!',
      timestamp: Date.now() + 1000,
      type: 'message'
    },
    {
      id: '3',
      userId: 'user2',
      username: 'Player2',
      message: 'Ready to play!',
      timestamp: Date.now() + 2000,
      type: 'message'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: {
      userId: string;
      nickname: string;
      message: string;
      timestamp: number;
      isGuess?: boolean;
    }) => {
      const newMessage: Message = {
        id: `${data.timestamp}-${data.userId}`,
        userId: data.userId,
        username: data.nickname,
        message: data.message,
        timestamp: data.timestamp,
        type: data.isGuess ? 'guess' : (isGameStarted ? 'guess' : 'message')
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const handleCorrectGuess = (data: {
      userId: string;
      username: string;
      word: string;
      points: number;
      totalScore: number;
      drawerPoints?: number;
      drawerScore?: number;
      message: string;
    }) => {
      const newMessage: Message = {
        id: `correct-${Date.now()}-${data.userId}`,
        userId: 'system',
        username: 'System',
        message: data.message,
        timestamp: Date.now(),
        type: 'system'
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const handleGameEnded = (data: {
      winner: { nickname: string; score: number };
      message: string;
    }) => {
      const newMessage: Message = {
        id: `game-end-${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: data.message,
        timestamp: Date.now(),
        type: 'system'
      };

      setMessages(prev => [...prev, newMessage]);
    };

    socket.on('chat-message', handleChatMessage);
    socket.on('correct-guess', handleCorrectGuess);
    socket.on('game-ended', handleGameEnded);

    return () => {
      socket.off('chat-message', handleChatMessage);
      socket.off('correct-guess', handleCorrectGuess);
      socket.off('game-ended', handleGameEnded);
    };
  }, [socket, isGameStarted]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    if (isGameStarted) {
      // During game, treat messages as guesses
      socket.emit('guess-word', {
        guess: inputMessage.trim()
      });
    } else {
      // Regular chat message
      socket.emit('chat-message', {
        message: inputMessage.trim()
      });
    }

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStyle = (message: Message) => {
    if (message.type === 'system') {
      return 'bg-blue-50 text-blue-800 text-center italic';
    }
    if (message.type === 'guess' && isGameStarted) {
      return 'bg-yellow-50 border-l-4 border-yellow-400';
    }
    if (message.userId === userId) {
      return 'bg-primary/10 border-l-4 border-primary';
    }
    return 'bg-secondary/50';
  };

  return (
    <div className="bg-card rounded-lg shadow-md border border-border h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center justify-between">
          <span>Chat</span>
          <span className="text-xs text-muted-foreground">
            {isGameStarted ? 'Guessing Mode' : 'Chat Mode'}
          </span>
        </h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.map((message) => (
          <div key={message.id} className={`p-2 rounded-lg transition-colors ${getMessageStyle(message)}`}>
            {message.type !== 'system' && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">
                  {message.username}
                  {message.userId === userId && (
                    <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            )}
            <div className="text-sm text-foreground break-words">
              {message.message}
            </div>
            {message.type === 'guess' && isGameStarted && (
              <div className="text-xs text-yellow-600 mt-1">
                💭 Guess
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isGameStarted ? "Type your guess..." : "Type a message..."}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
            maxLength={200}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            size="sm"
            className="px-4 shrink-0"
          >
            Send
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {isGameStarted ? (
            <span>💡 Your messages will be treated as guesses during the game</span>
          ) : (
            <span>Press Enter to send • {inputMessage.length}/200</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat; 
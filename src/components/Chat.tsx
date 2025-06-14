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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleChatHistory = (data: { messages: Message[] }) => {
      console.log('Received chat history:', data);
      setMessages(data.messages);
    };

    const handleChatMessage = (data: {
      id: string;
      userId: string;
      username: string;
      message: string;
      timestamp: number;
      type: 'message' | 'guess';
    }) => {
      console.log('Received chat message:', data);
      const newMessage: Message = {
        id: data.id,
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp,
        type: data.type
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const handleGameModeChanged = (data: {
      isGameStarted: boolean;
      message: string;
    }) => {
      console.log('Game mode changed:', data);
      const newMessage: Message = {
        id: `game-mode-${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: data.message,
        timestamp: Date.now(),
        type: 'system'
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const handleCorrectGuessNotification = (data: {
      userId: string;
      username: string;
      word: string;
      points: number;
      totalScore: number;
      message?: string;
    }) => {
      console.log('Correct guess notification:', data);
      const newMessage: Message = {
        id: `correct-${Date.now()}-${data.userId}`,
        userId: 'system',
        username: 'System',
        message: data.message || `${data.username} guessed "${data.word}" correctly! (+${data.points} points)`,
        timestamp: Date.now(),
        type: 'system'
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const handleUserJoinedChat = (data: {
      userId: string;
      username: string;
    }) => {
      console.log('User joined chat:', data);
      const newMessage: Message = {
        id: `join-${Date.now()}-${data.userId}`,
        userId: 'system',
        username: 'System',
        message: `${data.username} joined the chat`,
        timestamp: Date.now(),
        type: 'system'
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const handleUserLeftChat = (data: {
      userId: string;
      username: string;
    }) => {
      console.log('User left chat:', data);
      const newMessage: Message = {
        id: `leave-${Date.now()}-${data.userId}`,
        userId: 'system',
        username: 'System',
        message: `${data.username} left the chat`,
        timestamp: Date.now(),
        type: 'system'
      };

      setMessages(prev => [...prev, newMessage]);
    };

    // Chat service events
    socket.on('chat-history', handleChatHistory);
    socket.on('chat-message', handleChatMessage);
    socket.on('game-mode-changed', handleGameModeChanged);
    socket.on('correct-guess-notification', handleCorrectGuessNotification);
    socket.on('user-joined-chat', handleUserJoinedChat);
    socket.on('user-left-chat', handleUserLeftChat);

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('chat-message', handleChatMessage);
      socket.off('game-mode-changed', handleGameModeChanged);
      socket.off('correct-guess-notification', handleCorrectGuessNotification);
      socket.off('user-joined-chat', handleUserJoinedChat);
      socket.off('user-left-chat', handleUserLeftChat);
    };
  }, [socket]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    // Send message to chat service (it will handle game vs chat logic)
    socket.emit('chat-message', {
      message: inputMessage.trim()
    });

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
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Welcome to the chat!</p>
            <p>Messages will appear here.</p>
          </div>
        )}
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
import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from './ui/button';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system' | 'guess' | 'correct-guess';
}

interface ChatProps {
  roomCode: string;
  userId: string;
  username: string;
  isGameStarted: boolean;
  socket: Socket | null;
  gameSocket?: Socket | null;
}

const Chat: React.FC<ChatProps> = ({
  userId,
  isGameStarted,
  socket,
  gameSocket
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    // Scroll immediately if there are messages
    if (messages.length > 0) {
      // Use a small delay to ensure the DOM has updated
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
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
      
      // If game ended, clear chat immediately
      if (!data.isGameStarted) {
        console.log('Game ended - clearing chat');
        setMessages([]);
      }
      
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

    const handleNewRound = () => {
      console.log('New round started, clearing chat');
      // Clear all messages when new round starts
      setMessages([]);
    };

    const handleGameRestarted = () => {
      console.log('Game restarted, clearing chat');
      // Clear all messages when game restarts
      setMessages([]);
    };

    const handleForceClear = () => {
      console.log('Force clear chat event received');
      // Immediately clear all messages
      setMessages([]);
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
    socket.on('new-round', handleNewRound);
    socket.on('game-restarted', handleGameRestarted);
    socket.on('force-clear-chat', handleForceClear);
    socket.on('user-joined-chat', handleUserJoinedChat);
    socket.on('user-left-chat', handleUserLeftChat);

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('chat-message', handleChatMessage);
      socket.off('game-mode-changed', handleGameModeChanged);
      socket.off('new-round', handleNewRound);
      socket.off('game-restarted', handleGameRestarted);
      socket.off('force-clear-chat', handleForceClear);
      socket.off('user-joined-chat', handleUserJoinedChat);
      socket.off('user-left-chat', handleUserLeftChat);
    };
  }, [socket]);

  // Also listen to game socket for new-round events as backup
  useEffect(() => {
    if (!gameSocket) return;

    const handleGameNewRound = () => {
      console.log('New round from game service, clearing chat');
      setMessages([]);
    };

    const handleGameRestarted = () => {
      console.log('Game restarted from game service, clearing chat');
      setMessages([]);
    };

    const handleGameForceClear = () => {
      console.log('Force clear from game service, clearing chat');
      setMessages([]);
    };

    gameSocket.on('new-round', handleGameNewRound);
    gameSocket.on('game-restarted', handleGameRestarted);
    gameSocket.on('force-clear-chat', handleGameForceClear);

    return () => {
      gameSocket.off('new-round', handleGameNewRound);
      gameSocket.off('game-restarted', handleGameRestarted);
      gameSocket.off('force-clear-chat', handleGameForceClear);
    };
  }, [gameSocket]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    // Send message to chat service (it will handle game vs chat logic)
    socket.emit('chat-message', {
      message: inputMessage.trim()
    });

    setInputMessage('');
    
    // Force scroll to bottom after sending message
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 100);
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
    if (message.type === 'correct-guess') {
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 text-center font-bold border-2 border-green-400 shadow-md';
    }
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
      <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{maxHeight: '400px'}}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Welcome to the chat!</p>
            <p>Messages will appear here.</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`p-2 rounded-md transition-colors ${getMessageStyle(message)}`}>
            {message.type !== 'system' && message.type !== 'correct-guess' && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">
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
            <div className="text-xs text-foreground break-words">
              {message.type === 'correct-guess' ? (
                <div className="text-sm font-extrabold text-green-800 py-0.5">
                  {message.message}
                </div>
              ) : (
                message.message
              )}
            </div>
            {message.type === 'guess' && isGameStarted && (
              <div className="text-xs text-yellow-600 mt-0.5">
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
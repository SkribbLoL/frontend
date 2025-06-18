import { useState } from 'react';
import { Button } from '../components/ui/button';
import config from '../config';

interface ApiError extends Error {
  message: string;
}

const HomePage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    console.log('Creating room with URL:', `${config.api.baseUrl}/rooms`);

    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.api.baseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      // Navigate to room with the room code and user ID
      window.location.href = `/room/${data.roomCode}?userId=${data.userId}`;
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.api.baseUrl}/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      // Navigate to room with the room code and user ID
      window.location.href = `/room/${roomCode}?userId=${data.userId}`;
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">
            SkribbLoL
          </h1>
          <p className="text-lg text-muted-foreground text-center">
            Draw and guess League of Legends champions!
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-md overflow-hidden p-6 border border-border">
          {error && (
            <div className="mb-6 p-4 rounded-md bg-destructive/10 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="nickname" className="block text-sm font-medium text-foreground">
                Your Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                placeholder="Enter your nickname"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full h-11 text-base font-medium"
            >
              {isLoading ? 'Creating...' : 'Create New Room'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-muted-foreground bg-card">OR</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="roomCode" className="block text-sm font-medium text-foreground">
                  Room Code
                </label>
                <input
                  type="text"
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                  placeholder="Enter room code"
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleJoinRoom}
                disabled={isLoading}
                variant="secondary"
                className="w-full h-11 text-base font-medium"
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </Button>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2023 SkribbLoL. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
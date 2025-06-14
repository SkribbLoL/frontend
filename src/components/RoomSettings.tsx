import { useState } from 'react';
import { Button } from './ui/button';

interface RoomSettingsProps {
  onStartGame: (settings: GameSettings) => void;
  isStarting: boolean;
  minPlayers: number;
  currentPlayers: number;
}

export interface GameSettings {
  maxPlayers: number;
  rounds: number;
  roundDuration: number; // in seconds
}

const RoomSettings: React.FC<RoomSettingsProps> = ({
  onStartGame,
  isStarting,
  minPlayers,
  currentPlayers
}) => {
  const [settings, setSettings] = useState<GameSettings>({
    maxPlayers: 8,
    rounds: 3,
    roundDuration: 60
  });

  const [errors, setErrors] = useState<string[]>([]);

  const validateSettings = (): boolean => {
    const newErrors: string[] = [];

    if (currentPlayers < minPlayers) {
      newErrors.push(`Need at least ${minPlayers} players to start`);
    }

    if (currentPlayers > settings.maxPlayers) {
      newErrors.push(`Too many players for current max (${settings.maxPlayers})`);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleStartGame = () => {
    if (validateSettings()) {
      onStartGame(settings);
    }
  };

  const updateSetting = (key: keyof GameSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setErrors([]); // Clear errors when settings change
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Game Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your game before starting</p>
      </div>

      {/* Max Players Setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Maximum Players: {settings.maxPlayers}
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">2</span>
          <input
            type="range"
            min="2"
            max="10"
            value={settings.maxPlayers}
            onChange={(e) => updateSetting('maxPlayers', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">10</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Currently: {currentPlayers}/{settings.maxPlayers} players
        </p>
      </div>

      {/* Rounds Setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Number of Rounds: {settings.rounds}
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">1</span>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.rounds}
            onChange={(e) => updateSetting('rounds', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">10</span>
        </div>
      </div>

      {/* Round Duration Setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Round Duration: {Math.floor(settings.roundDuration / 60)}:{(settings.roundDuration % 60).toString().padStart(2, '0')}
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">15s</span>
          <input
            type="range"
            min="15"
            max="90"
            step="15"
            value={settings.roundDuration}
            onChange={(e) => updateSetting('roundDuration', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">90s</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => updateSetting('roundDuration', 30)}
            className="hover:text-foreground transition-colors"
          >
            30s
          </button>
          <button
            type="button"
            onClick={() => updateSetting('roundDuration', 45)}
            className="hover:text-foreground transition-colors"
          >
            45s
          </button>
          <button
            type="button"
            onClick={() => updateSetting('roundDuration', 60)}
            className="hover:text-foreground transition-colors"
          >
            1m
          </button>
          <button
            type="button"
            onClick={() => updateSetting('roundDuration', 90)}
            className="hover:text-foreground transition-colors"
          >
            90s
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Start Game Button */}
      <Button 
        onClick={handleStartGame}
        disabled={isStarting || errors.length > 0} 
        className="w-full py-3 text-sm font-medium"
        size="lg"
      >
        {isStarting ? 'Starting Game...' : 'Start Game'}
      </Button>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 Settings can only be changed by the room host
        </p>
      </div>
    </div>
  );
};

export default RoomSettings; 
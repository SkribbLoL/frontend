import { Button } from './ui/button';

interface GameEndScreenProps {
  winner: { nickname: string; score: number };
  winners?: Array<{ nickname: string; score: number }>;
  finalScores: Array<{ id: string; nickname: string; score: number }>;
  isHost: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
  winner,
  winners,
  finalScores,
  isHost,
  onPlayAgain,
  onReturnToLobby
}) => {
  // Use winners array if available, otherwise fallback to single winner
  const actualWinners = winners || [winner];
  const isMultipleWinners = actualWinners.length > 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-primary/10 to-secondary/20 rounded-lg p-8">
      {/* Winner Announcement */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-primary mb-2">Game Over!</h1>
        <div className="bg-primary/10 rounded-lg p-6 border-2 border-primary">
          {isMultipleWinners ? (
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                🏆 It's a tie for 1st place!
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                Winners: {actualWinners.map(w => w.nickname).join(', ')}
              </p>
              <p className="text-lg text-muted-foreground">
                {actualWinners[0].score} points each
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                🏆 Winner: {winner.nickname}
              </h2>
              <p className="text-lg text-muted-foreground">
                {winner.score} points
              </p>
            </>
          )}
        </div>
      </div>

      {/* Final Scores Table */}
      <div className="w-full max-w-2xl mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
          Final Rankings
        </h3>
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-lg">
          <div className="bg-secondary px-6 py-3 border-b border-border">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Score</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {finalScores.map((player, index) => {
              // Calculate actual rank based on scores (handle ties)
              let actualRank = 1;
              for (let i = 0; i < index; i++) {
                if (finalScores[i].score > player.score) {
                  actualRank++;
                }
              }
              
              // Check if this player is tied with the previous player
              const isPreviousTie = index > 0 && finalScores[index - 1].score === player.score;
              const displayRank = isPreviousTie ? '' : actualRank;

              return (
                <div
                  key={player.id}
                  className={`px-6 py-4 grid grid-cols-3 gap-4 items-center ${
                    actualRank === 1 
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400' 
                      : actualRank === 2 
                      ? 'bg-gray-50 dark:bg-gray-950/20 border-l-4 border-gray-400'
                      : actualRank === 3
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-400'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-muted-foreground mr-2">
                      {displayRank}
                    </span>
                    {actualRank === 1 && <span className="text-yellow-500">🥇</span>}
                    {actualRank === 2 && <span className="text-gray-500">🥈</span>}
                    {actualRank === 3 && <span className="text-orange-500">🥉</span>}
                  </div>
                  <div>
                    <span className={`font-medium ${
                      actualRank === 1 ? 'text-yellow-700 dark:text-yellow-300' : 'text-foreground'
                    }`}>
                      {player.nickname}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${
                      actualRank === 1 ? 'text-yellow-700 dark:text-yellow-300' : 'text-foreground'
                    }`}>
                      {player.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onReturnToLobby}
          variant="outline"
          size="lg"
          className="px-8"
        >
          Return to Lobby
        </Button>
        
        {isHost && (
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="px-8"
          >
            Play Again
          </Button>
        )}
      </div>

      {!isHost && (
        <p className="text-sm text-muted-foreground mt-4">
          Waiting for host to start a new game...
        </p>
      )}
    </div>
  );
};

export default GameEndScreen; 
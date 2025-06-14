import { Button } from './ui/button';

interface WordSelectionProps {
  words: string[];
  onWordSelect: (word: string) => void;
  isVisible: boolean;
}

const WordSelection: React.FC<WordSelectionProps> = ({
  words,
  onWordSelect,
  isVisible
}) => {
  if (!isVisible || !words || words.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Choose a word to draw!</h2>
          <p className="text-muted-foreground">Select one of the three words below</p>
        </div>
        
        <div className="space-y-3">
          {words.map((word, index) => (
            <Button
              key={word}
              onClick={() => onWordSelect(word)}
              variant="outline"
              className="w-full py-4 text-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {index + 1}. {word}
            </Button>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Choose carefully! Other players will try to guess your drawing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WordSelection; 
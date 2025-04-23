// src/components/ColorfulCharacters.tsx
import React from 'react';

interface Character {
  color: string;
  face: string;
}

const ColorfulCharacters: React.FC = () => {
  // Array of character objects with color and emotion
  const characters: Character[] = [
    { color: "#FF5252", face: "😠" }, // Red
    { color: "#FF9800", face: "😮" }, // Orange
    { color: "#FFEB3B", face: "🙂" }, // Yellow
    { color: "#4CAF50", face: "😊" }, // Green
    { color: "#03A9F4", face: "😀" }, // Blue
    { color: "#673AB7", face: "😈" }, // Purple
    { color: "#E040FB", face: "🤩" }, // Pink
    { color: "#F48FB1", face: "😍" }  // Light Pink
  ];

  return (
    <div className="flex justify-center">
      {characters.map((char: Character, index: number) => (
        <div 
          key={index} 
          className="mx-1 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: char.color }}
        >
          {char.face}
        </div>
      ))}
    </div>
  );
};

export default ColorfulCharacters;
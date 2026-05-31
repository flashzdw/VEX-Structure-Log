import { Character } from '../store/gameStore';

interface CharacterSpriteProps {
  character: Character;
  isCurrentTurn: boolean;
}

const AngelSprite = ({ character, isCurrentTurn }: { character: Character; isCurrentTurn: boolean }) => {
  const animationClass = `pixel-character ${character.currentAnimation}`;
  
  return (
    <div className={`relative ${isCurrentTurn ? 'ring-4 ring-yellow-400' : ''}`}>
      <div className={`${animationClass} w-20 h-24 flex flex-col items-center`}>
        <div className="w-6 h-2 bg-yellow-400 rounded-sm mb-1 animate-pulse" style={{ boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)' }}>
          <div className="w-4 h-1 bg-yellow-300 rounded-sm mx-auto mt-0.5"></div>
        </div>
        
        <div className="flex justify-center -space-x-4 mb-1">
          <div className="w-8 h-6 bg-white rounded-t-full transform -rotate-12"></div>
          <div className="w-8 h-6 bg-white rounded-t-full transform rotate-12"></div>
        </div>
        
        <div className="w-12 h-14 bg-white rounded-t-lg relative">
          <div className="absolute top-2 left-1.5 w-2 h-2 bg-blue-600 rounded-full"></div>
          <div className="absolute top-2 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></div>
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-red-400 rounded-sm"></div>
          <div className="absolute top-7 left-1 w-2 h-3 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-7 right-1 w-2 h-3 bg-gray-400 rounded-sm"></div>
        </div>
        
        <div className="flex justify-center -space-x-2 mt-1">
          <div className="w-10 h-6 bg-white rounded-b-lg"></div>
          <div className="w-10 h-6 bg-white rounded-b-lg"></div>
        </div>
        
        <div className="absolute bottom-8 right-0">
          <div className="w-6 h-8 bg-blue-500 rounded-sm">
            <div className="w-full h-1 bg-blue-400 mt-1"></div>
            <div className="w-full h-1 bg-blue-400 mt-1"></div>
          </div>
        </div>
      </div>
      
      {character.isDefending && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">🛡️</span>
        </div>
      )}
      
      {character.hasCurse && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs">💀</span>
        </div>
      )}
    </div>
  );
};

const DevilSprite = ({ character, isCurrentTurn }: { character: Character; isCurrentTurn: boolean }) => {
  const animationClass = `pixel-character ${character.currentAnimation}`;
  
  return (
    <div className={`relative ${isCurrentTurn ? 'ring-4 ring-red-500' : ''}`}>
      <div className={`${animationClass} w-20 h-24 flex flex-col items-center`}>
        <div className="flex justify-center -space-x-2 mb-1">
          <div className="w-3 h-5 bg-gray-800 rounded-t-lg transform -rotate-6"></div>
          <div className="w-3 h-5 bg-gray-800 rounded-t-lg transform rotate-6"></div>
        </div>
        
        <div className="w-12 h-14 bg-red-600 rounded-t-lg relative">
          <div className="absolute top-2 left-1.5 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute top-2 right-1.5 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute top-3 left-2 w-1 h-1 bg-black rounded-full"></div>
          <div className="absolute top-3 right-2 w-1 h-1 bg-black rounded-full"></div>
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-red-700 rounded-full"></div>
          <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-5 h-2 bg-yellow-500 rounded-sm"></div>
          <div className="absolute top-9 left-1 w-2 h-2 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-9 right-1 w-2 h-2 bg-gray-400 rounded-sm"></div>
        </div>
        
        <div className="flex justify-center -space-x-2 mt-1">
          <div className="w-10 h-6 bg-red-700 rounded-b-lg"></div>
          <div className="w-10 h-6 bg-red-700 rounded-b-lg"></div>
        </div>
        
        <div className="absolute bottom-8 right-0">
          <div className="w-3 h-10 bg-gray-800 relative">
            <div className="absolute -top-1 left-0 w-2 h-3 bg-gray-700 rounded-full transform -rotate-45"></div>
            <div className="absolute -top-1 right-0 w-2 h-3 bg-gray-700 rounded-full transform rotate-45"></div>
          </div>
        </div>
      </div>
      
      {character.isDefending && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">🛡️</span>
        </div>
      )}
    </div>
  );
};

export const CharacterSprite = ({ character, isCurrentTurn }: CharacterSpriteProps) => {
  if (character.type === 'angel') {
    return <AngelSprite character={character} isCurrentTurn={isCurrentTurn} />;
  }
  return <DevilSprite character={character
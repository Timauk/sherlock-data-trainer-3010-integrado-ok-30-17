import React from 'react';

interface Player {
  id: number;
  score: number;
  predictions: number[];
  fitness: number;
}

interface PlayerListProps {
  players: Player[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  const maxFitness = Math.max(...players.map(p => p.fitness));
  const maxScore = Math.max(...players.map(p => p.score));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {players.map(player => {
        const isTopPlayer = player.fitness === maxFitness && player.score === maxScore;
        const matches = player.predictions.length > 0 ? 
          player.predictions.filter(num => num >= 1 && num <= 25).length : 0;

        return (
          <div 
            key={player.id} 
            className={`p-4 rounded-lg shadow ${
              isTopPlayer ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-100'
            }`}
          >
            <h4 className="font-semibold text-lg mb-2">
              Jogador {player.id}
              {isTopPlayer && <span className="ml-2 text-yellow-600">👑</span>}
            </h4>
            <p className="mb-1">Pontuação Total: {player.score.toFixed(2)}</p>
            <p className="mb-1">Fitness Atual: {player.fitness.toFixed(2)}</p>
            <div className="text-sm">
              <p className="mb-1">Última Previsão:</p>
              <div className="flex flex-wrap gap-1">
                {player.predictions.map((num, idx) => (
                  <span 
                    key={idx}
                    className="inline-block bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;
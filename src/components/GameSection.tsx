import React from 'react';
import { Card } from "@/components/ui/card";
import PlayerCard from './PlayerCard';
import EvolutionChart from './EvolutionChart';

interface GameSectionProps {
  players: Array<{
    id: number;
    score: number;
    predictions: number[];
    weights: number[];
    fitness: number;
  }>;
  boardNumbers: number[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  logs: Array<{ message: string; matches?: number }>;
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
}

const GameSection: React.FC<GameSectionProps> = ({
  players,
  boardNumbers,
  evolutionData,
  logs,
  onUpdatePlayer
}) => {
  const maxScore = Math.max(...players.map(p => p.score));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Números do Concurso</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {boardNumbers.map((number, index) => (
            <span key={index} className="inline-block bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold">
              {number}
            </span>
          ))}
        </div>
        
        <h3 className="text-lg font-semibold mb-4">Jogadores Ativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onUpdatePlayer={onUpdatePlayer}
              isChampion={player.score === maxScore}
            />
          ))}
        </div>
      </Card>
      
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Evolução dos Jogadores</h3>
          <EvolutionChart data={evolutionData} />
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Logs em Tempo Real</h3>
          <div className="bg-muted p-4 rounded-lg h-[400px] overflow-y-auto">
            {logs.map((log, index) => (
              <p key={index} className={`mb-2 ${log.matches ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>
                {log.message}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameSection;
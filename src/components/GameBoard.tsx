import React from 'react';
import BoardDisplay from './BoardDisplay';
import PlayerList from './PlayerList';
import EvolutionChart from './EvolutionChart';

interface GameBoardProps {
  boardNumbers: number[];
  concursoNumber: number;
  players: { 
    id: number; 
    score: number; 
    predictions: number[];
    weights: number[];
    fitness: number;
  }[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  boardNumbers, 
  concursoNumber, 
  players, 
  evolutionData = [],
  onUpdatePlayer
}) => {
  return (
    <div>
      <BoardDisplay numbers={boardNumbers} concursoNumber={concursoNumber} />
      <PlayerList players={players} onUpdatePlayer={onUpdatePlayer} />
      <EvolutionChart data={evolutionData} />
    </div>
  );
};

export default GameBoard;
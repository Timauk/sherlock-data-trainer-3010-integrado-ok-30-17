import React from 'react';
import BoardDisplay from './BoardDisplay';
import PlayerList from './PlayerList';
import EvolutionChart from './EvolutionChart';
import { Player } from '@/types/gameTypes';

interface GameBoardProps {
  boardNumbers: number[];
  concursoNumber: number;
  players: Player[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  boardNumbers, 
  concursoNumber, 
  players, 
  evolutionData = [] 
}) => {
  return (
    <div>
      <BoardDisplay numbers={boardNumbers} concursoNumber={concursoNumber} />
      <PlayerList players={players} />
      <EvolutionChart data={evolutionData} />
    </div>
  );
};

export default GameBoard;
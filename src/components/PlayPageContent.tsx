import React from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import GameMetrics from './GameMetrics';
import ControlPanel from './GameControls/ControlPanel';
import AnalysisTabs from './GameAnalysis/AnalysisTabs';

interface PlayPageContentProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
  progress: number;
  generation: number;
  gameLogic: ReturnType<typeof useGameLogic>;
}

export const PlayPageContent: React.FC<PlayPageContentProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onCsvUpload,
  onModelUpload,
  onSaveModel,
  progress,
  generation,
  gameLogic
}) => {
  // Encontra o champion com verificação de null
  const champion = gameLogic.players && gameLogic.players.length > 0 
    ? gameLogic.players.reduce((prev, current) => 
        (current.fitness > (prev?.fitness || 0)) ? current : prev, 
        gameLogic.players[0])
    : null;

  return (
    <div className="flex flex-col gap-4">
      <GameMetrics 
        progress={progress}
        champion={champion}
        modelMetrics={gameLogic.modelMetrics}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ControlPanel
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onReset={onReset}
            onThemeToggle={onThemeToggle}
            onCsvUpload={onCsvUpload}
            onModelUpload={onModelUpload}
            onSaveModel={onSaveModel}
            toggleInfiniteMode={gameLogic.toggleInfiniteMode}
            toggleManualMode={gameLogic.toggleManualMode}
            isInfiniteMode={gameLogic.isInfiniteMode}
            isManualMode={gameLogic.isManualMode}
          />
        </div>
      </div>

      <AnalysisTabs
        boardNumbers={gameLogic.boardNumbers}
        concursoNumber={gameLogic.concursoNumber}
        players={gameLogic.players}
        evolutionData={gameLogic.evolutionData}
        logs={gameLogic.logs}
        dates={gameLogic.dates}
        numbers={gameLogic.numbers}
        updateFrequencyData={gameLogic.updateFrequencyData}
        modelMetrics={gameLogic.modelMetrics}
        neuralNetworkVisualization={gameLogic.neuralNetworkVisualization}
      />
    </div>
  );
};

export default PlayPageContent;
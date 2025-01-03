import React, { useState } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import GameMetrics from './GameMetrics';
import ControlPanel from './GameControls/ControlPanel';
import AnalysisTabs from './GameAnalysis/AnalysisTabs';
import ChampionPredictions from './ChampionPredictions';
import ProcessingSelector from './ProcessingSelector';
import GeneticTreeVisualization from './GeneticTreeVisualization';
import { useGameLogic } from '@/hooks/useGameLogic';

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

const PlayPageContent: React.FC<PlayPageContentProps> = ({
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
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const { status: serverStatus } = useServerStatus();
  
  const champion = gameLogic.players && gameLogic.players.length > 0 
    ? gameLogic.players.reduce((prev, current) => 
        (current.fitness > (prev?.fitness || 0)) ? current : prev, 
        gameLogic.players[0])
    : null;

  return (
    <div className="flex flex-col gap-4">
      <ProcessingSelector
        isServerProcessing={isServerProcessing}
        onToggleProcessing={() => setIsServerProcessing(prev => !prev)}
        serverStatus={serverStatus}
      />
      
      <GameMetrics 
        progress={progress}
        champion={champion}
        modelMetrics={gameLogic.modelMetrics}
      />
      
      <GeneticTreeVisualization 
        players={gameLogic.players}
        generation={gameLogic.generation}
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
            disabled={serverStatus === 'checking' || (isServerProcessing && serverStatus === 'offline')}
          />
        </div>
        
        <ChampionPredictions
          champion={champion}
          trainedModel={gameLogic.trainedModel}
          lastConcursoNumbers={gameLogic.boardNumbers}
          isServerProcessing={isServerProcessing}
        />
      </div>

      <AnalysisTabs
        boardNumbers={gameLogic.boardNumbers}
        concursoNumber={gameLogic.concursoNumber}
        players={gameLogic.players}
        evolutionData={gameLogic.evolutionData}
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

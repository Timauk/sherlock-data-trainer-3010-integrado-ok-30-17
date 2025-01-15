import React, { useState } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import GameMetrics from './GameMetrics';
import ControlPanel from './GameControls/ControlPanel';
import AnalysisTabs from './GameAnalysis/AnalysisTabs';
import ChampionPredictions from './ChampionPredictions';
import ProcessingSelector from './ProcessingSelector';
import GeneticTreeVisualization from './GeneticTreeVisualization';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Player } from '@/types/gameTypes';
import RealTimeFeedback from './RealTimeFeedback';

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
  const [isServerProcessing, setIsServerProcessing] = useState<boolean>(false);
  const { status: serverStatus } = useServerStatus();
  
  const champion: Player | null = gameLogic.players && gameLogic.players.length > 0 
    ? gameLogic.players.reduce((prev: Player | null, current: Player) => 
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GameMetrics 
          progress={progress}
          champion={champion}
          modelMetrics={gameLogic.modelMetrics}
        />
        
        <RealTimeFeedback
          accuracy={gameLogic.modelMetrics.accuracy * 100}
          predictionConfidence={champion?.fitness ? champion.fitness * 100 : 0}
          processingSpeed={90}
          memoryUsage={75}
        />
      </div>
      
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
          champion={champion || undefined}
          trainedModel={gameLogic.trainedModel || undefined}
          lastConcursoNumbers={gameLogic.boardNumbers}
          isServerProcessing={isServerProcessing}
        />
      </div>
      
      <AnalysisTabs
        numbers={gameLogic.numbers}
        dates={gameLogic.dates}
        modelMetrics={gameLogic.modelMetrics}
        neuralNetworkVisualization={gameLogic.neuralNetworkVisualization}
        updateFrequencyData={gameLogic.updateFrequencyData}
      />
    </div>
  );
};

export default PlayPageContent;

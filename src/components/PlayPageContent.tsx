import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import { GameMetrics } from '@/components/GameMetrics';
import { ControlPanel } from '@/components/GameControls/ControlPanel';
import ChampionPredictions from '@/components/ChampionPredictions';
import AnalysisTabs from '@/components/GameAnalysis/AnalysisTabs';
import ProcessingSelector from '@/components/ProcessingSelector';
import { Slider } from "@/components/ui/slider";

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
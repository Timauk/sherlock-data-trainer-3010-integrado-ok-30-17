import React from 'react';
import { Button } from "@/components/ui/button";
import GameMetrics from './GameMetrics';
import { Player } from '@/types/gameTypes';

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
  gameLogic: {
    champion: Player | null;
    modelMetrics: {
      accuracy: number;
      predictionConfidence?: number;
    };
  };
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
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCsvUpload(file);
    }
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length >= 2) {
      onModelUpload(files[0], files[1]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <Button onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button onClick={onReset}>Reiniciar</Button>
        <Button onClick={onThemeToggle}>Alternar Tema</Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-2">Carregar CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>

        <div>
          <label className="block mb-2">Carregar Modelo</label>
          <input
            type="file"
            multiple
            accept=".json,.weights.bin"
            onChange={handleModelUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>

        <Button onClick={onSaveModel}>Salvar Modelo</Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Geração: {generation}</h3>
        <GameMetrics
          progress={progress}
          champion={gameLogic.champion}
          modelMetrics={gameLogic.modelMetrics}
        />
      </div>
    </div>
  );
};

export default PlayPageContent;
import React from 'react';
import { Button } from "@/components/ui/button";
import DataUploader from '../DataUploader';

interface ControlPanelProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
  toggleInfiniteMode: () => void;
  toggleManualMode: () => void;
  isInfiniteMode: boolean;
  isManualMode: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onCsvUpload,
  onModelUpload,
  onSaveModel,
  toggleInfiniteMode,
  toggleManualMode,
  isInfiniteMode,
  isManualMode
}) => {
  return (
    <div className="space-y-4">
      <DataUploader 
        onCsvUpload={onCsvUpload} 
        onModelUpload={onModelUpload} 
        onSaveModel={onSaveModel} 
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button onClick={onReset}>Reiniciar</Button>
        <Button onClick={onThemeToggle}>Alternar Tema</Button>
        <Button onClick={toggleInfiniteMode}>
          {isInfiniteMode ? 'Desativar' : 'Ativar'} Modo Infinito
        </Button>
        <Button 
          onClick={toggleManualMode}
          variant={isManualMode ? "destructive" : "outline"}
        >
          {isManualMode ? 'Desativar' : 'Ativar'} Modo Manual
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
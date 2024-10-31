import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Copy } from 'lucide-react';
import { Player } from '@/types/gameTypes';
import { Weight } from './PlayerList';

interface PlayerWeightsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  editedWeights: Weight[];
  onWeightChange: (index: number, value: number) => void;
  onSaveWeights: () => void;
  onClonePlayer: (player: Player) => void;
}

const PlayerWeightsDialog: React.FC<PlayerWeightsDialogProps> = ({
  isOpen,
  onOpenChange,
  player,
  editedWeights,
  onWeightChange,
  onSaveWeights,
  onClonePlayer,
}) => {
  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar Pesos do Jogador #{player.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {editedWeights.map((weight, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">
                  {weight.name}
                  <span className="ml-2 text-muted-foreground">({weight.value})</span>
                </label>
                <span className="text-xs text-muted-foreground">{weight.description}</span>
              </div>
              <Slider
                value={[weight.value]}
                min={0}
                max={1000}
                step={1}
                onValueChange={(value) => onWeightChange(index, value[0])}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button 
              onClick={onSaveWeights} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Salvar Alterações
            </Button>
            <Button
              onClick={() => onClonePlayer(player)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="mr-2 h-4 w-4" />
              Clonar Jogador
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerWeightsDialog;
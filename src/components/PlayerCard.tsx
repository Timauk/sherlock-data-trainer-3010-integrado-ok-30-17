import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PlayerCardProps {
  player: {
    id: number;
    score: number;
    predictions: number[];
    weights: number[];
    fitness: number;
  };
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
  isChampion?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onUpdatePlayer, isChampion }) => {
  const { toast } = useToast();
  const [editedWeights, setEditedWeights] = React.useState(player.weights);

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...editedWeights];
    newWeights[index] = value;
    setEditedWeights(newWeights);
  };

  const handleSaveWeights = () => {
    if (onUpdatePlayer) {
      onUpdatePlayer(player.id, editedWeights);
      toast({
        title: "Pesos Atualizados",
        description: `Os pesos do Jogador #${player.id} foram atualizados com sucesso.`
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={`p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg
          ${isChampion ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-100'}`}>
          <h4 className="font-semibold text-lg mb-2">
            Jogador {player.id}
            {isChampion && <span className="ml-2 text-yellow-600">👑</span>}
          </h4>
          <p className="mb-1">Pontuação: {player.score.toFixed(2)}</p>
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">Previsões:</p>
            <div className="flex flex-wrap gap-1">
              {player.predictions.map((num, idx) => (
                <span key={idx} className="inline-block bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {num}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Clique para ajustar os pesos</p>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar Pesos do Jogador #{player.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {editedWeights.map((weight, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">
                  Peso {index + 1}
                  <span className="ml-2 text-gray-500">({weight.toFixed(2)})</span>
                </label>
              </div>
              <Slider
                value={[weight]}
                min={0}
                max={1000}
                step={1}
                onValueChange={(value) => handleWeightChange(index, value[0])}
              />
            </div>
          ))}
          <Button onClick={handleSaveWeights} className="w-full">
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerCard;
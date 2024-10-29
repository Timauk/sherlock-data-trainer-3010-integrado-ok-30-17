import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Weight {
  name: string;
  value: number;
  description: string;
}

interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
}

interface PlayerListProps {
  players: Player[];
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onUpdatePlayer }) => {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editedWeights, setEditedWeights] = useState<Weight[]>([]);
  const maxScore = Math.max(...players.map(p => p.score));

  const handlePlayerClick = (player: Player) => {
    const weights = player.weights.map((value, index) => ({
      ...WEIGHT_DESCRIPTIONS[index],
      value: Math.round(value)
    }));
    setEditedWeights(weights);
    setSelectedPlayer(player);
  };

  const handleWeightChange = (index: number, newValue: number) => {
    const newWeights = [...editedWeights];
    newWeights[index] = { ...newWeights[index], value: newValue };
    setEditedWeights(newWeights);
  };

  const handleSaveWeights = () => {
    if (selectedPlayer && onUpdatePlayer) {
      onUpdatePlayer(selectedPlayer.id, editedWeights.map(w => w.value));
      toast({
        title: "Pesos Atualizados",
        description: `Os pesos do Jogador #${selectedPlayer.id} foram atualizados com sucesso.`
      });
    }
  };

  const formatPredictions = (predictions: number[]) => {
    return predictions.length > 0 
      ? predictions.map(n => n.toString().padStart(2, '0')).join(', ')
      : 'Aguardando próxima rodada';
  };

  const calculateMatches = (player: Player, boardNumbers: number[]) => {
    if (!player.predictions.length || !boardNumbers.length) return 0;
    return player.predictions.filter(num => boardNumbers.includes(num)).length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {players.map(player => {
        const isTopPlayer = player.score === maxScore;
        
        return (
          <Dialog key={player.id}>
            <DialogTrigger asChild>
              <div 
                onClick={() => handlePlayerClick(player)}
                className={`p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg
                  ${isTopPlayer ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500' : 'bg-card'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-lg">
                    Jogador #{player.id}
                    {isTopPlayer && <span className="ml-2 text-yellow-600">👑</span>}
                  </h4>
                  <Badge variant={isTopPlayer ? "default" : "secondary"}>
                    Score: {player.score.toFixed(0)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Previsões:</span> {formatPredictions(player.predictions)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Acertos:</span> {player.fitness}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Fitness:</span> {player.fitness.toFixed(2)}
                  </p>
                </div>
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
      })}
    </div>
  );
};

const WEIGHT_DESCRIPTIONS: Weight[] = [
  { name: "Aprendizado Base", value: 0, description: "Capacidade de aprender com dados históricos" },
  { name: "Adaptabilidade", value: 0, description: "Velocidade de adaptação a mudanças" },
  { name: "Memória", value: 0, description: "Capacidade de reter padrões importantes" },
  { name: "Intuição", value: 0, description: "Habilidade de detectar padrões sutis" },
  { name: "Precisão", value: 0, description: "Acurácia nas previsões" },
  { name: "Consistência", value: 0, description: "Estabilidade nas previsões" },
  { name: "Inovação", value: 0, description: "Capacidade de encontrar novos padrões" },
  { name: "Equilíbrio", value: 0, description: "Balanceamento entre exploração e aproveitamento" },
  { name: "Foco", value: 0, description: "Concentração em padrões relevantes" },
  { name: "Resiliência", value: 0, description: "Recuperação após erros" },
  { name: "Otimização", value: 0, description: "Eficiência no uso dos recursos" },
  { name: "Cooperação", value: 0, description: "Capacidade de aprender com outros jogadores" },
  { name: "Especialização", value: 0, description: "Foco em nichos específicos" },
  { name: "Generalização", value: 0, description: "Adaptação a diferentes cenários" },
  { name: "Evolução", value: 0, description: "Taxa de melhoria ao longo do tempo" },
  { name: "Estabilidade", value: 0, description: "Consistência no desempenho" },
  { name: "Criatividade", value: 0, description: "Capacidade de gerar soluções únicas" }
];

export default PlayerList;
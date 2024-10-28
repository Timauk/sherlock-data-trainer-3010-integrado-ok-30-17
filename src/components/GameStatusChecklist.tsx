import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GameStatusChecklistProps {
  csvLoaded: boolean;
  modelAccuracy: number;
  championFitness: number;
}

const GameStatusChecklist: React.FC<GameStatusChecklistProps> = ({
  csvLoaded,
  modelAccuracy,
  championFitness
}) => {
  const getStatusColor = (condition: 'red' | 'yellow' | 'green') => {
    switch (condition) {
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
    }
  };

  const getModelStatus = (accuracy: number) => {
    if (accuracy < 50) return 'red';
    if (accuracy < 100) return 'yellow';
    return 'green';
  };

  const getChampionStatus = (fitness: number) => {
    if (fitness < 5) return 'red';
    if (fitness < 10) return 'yellow';
    return 'green';
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Status do Jogo</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${csvLoaded ? getStatusColor('green') : getStatusColor('red')}`} />
            <span>Dados CSV Carregados</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Carregue um arquivo CSV com os dados históricos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(getModelStatus(modelAccuracy))}`} />
            <span>Treinamento do Modelo</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Acurácia do modelo: {modelAccuracy.toFixed(2)}%<br/>
                     Verde: >100 jogos<br/>
                     Amarelo: >50 jogos<br/>
                     Vermelho: menos de 50 jogos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(getChampionStatus(championFitness))}`} />
            <span>Fitness do Campeão</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fitness atual: {championFitness.toFixed(2)}<br/>
                     Verde: >10 acertos<br/>
                     Amarelo: >5 acertos<br/>
                     Vermelho: menos de 5 acertos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameStatusChecklist;
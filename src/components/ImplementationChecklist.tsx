import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const phases = [
  {
    title: "Fase 1: Coleta de Dados",
    items: [
      { task: "Coletar dados históricos", completed: true },
      { task: "Validar dados", completed: true },
      { task: "Armazenar dados no banco", completed: true },
    ]
  },
  {
    title: "Fase 2: Processamento de Dados",
    items: [
      { task: "Normalizar dados", completed: true },
      { task: "Analisar dados para tendências", completed: true },
      { task: "Identificar padrões", completed: true },
    ]
  },
  {
    title: "Fase 3: Modelagem",
    items: [
      { task: "Criar modelo preditivo", completed: true },
      { task: "Ajustar hiperparâmetros", completed: true },
      { task: "Treinar modelo", completed: true },
    ]
  },
  {
    title: "Fase 4: Avaliação de Modelo",
    items: [
      { task: "Testar precisão do modelo", completed: true },
      { task: "Ajustar modelo conforme necessidade", completed: true },
    ]
  },
  {
    title: "Fase 5: Implementação",
    items: [
      { task: "Integrar modelo na aplicação", completed: true },
      { task: "Configurar limites e alertas", completed: true },
    ]
  },
  {
    title: "Fase 6: Monitoramento",
    items: [
      { task: "Monitorar desempenho do modelo", completed: true },
      { task: "Ajustar conforme feedback", completed: true },
    ]
  },
  {
    title: "Fase 7: Análise Avançada",
    items: [
      { task: "Criar views para análise estatística", completed: true },
      { task: "Implementar machine learning no banco", completed: true },
      { task: "Criar sistema de recomendações", completed: true },
      { task: "Implementar análise preditiva em tempo real", completed: true }
    ]
  }
];

const ImplementationChecklist: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de Implementação</CardTitle>
      </CardHeader>
      <CardContent>
        {phases.map((phase, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-lg font-semibold">{phase.title}</h3>
            <Progress value={phase.items.filter(item => item.completed).length} max={phase.items.length} />
            <ul className="list-disc pl-5">
              {phase.items.map((item, idx) => (
                <li key={idx} className={item.completed ? "line-through" : ""}>
                  {item.task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ImplementationChecklist;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChecklistItem {
  title: string;
  items: {
    task: string;
    completed: boolean;
    inProgress?: boolean;
  }[];
}

const implementationChecklist: ChecklistItem[] = [
  {
    title: "Fase 1: Alta Prioridade - Gestão de Dados e IA",
    items: [
      { task: "Implementar sumarização de dados históricos", completed: true },
      { task: "Criar sistema de ponderação para dados históricos", completed: true },
      { task: "Implementar retreinamento periódico do modelo", completed: true },
      { task: "Adicionar threads de trabalho para cálculos pesados", completed: true },
      { task: "Implementar ensemble learning com modelos especializados", completed: true },
      { task: "Configurar monitoramento de desempenho básico", completed: true }
    ]
  },
  {
    title: "Fase 2: Otimização de Performance",
    items: [
      { task: "Implementar processamento em lote para previsões", completed: true },
      { task: "Configurar cache do lado do servidor", completed: true },
      { task: "Implementar compressão de dados históricos", completed: true },
      { task: "Otimizar E/S de disco para checkpoints", completed: true }
    ]
  },
  {
    title: "Fase 3: Modelos Especializados",
    items: [
      { task: "Modelo para padrões sazonais", completed: true },
      { task: "Modelo para análise de frequência", completed: true },
      { task: "Modelo para correlações lunares", completed: true },
      { task: "Modelo para padrões sequenciais", completed: true }
    ]
  },
  {
    title: "Fase 4: Validação e Qualidade",
    items: [
      { task: "Implementar validação cruzada", completed: true },
      { task: "Adicionar sistema de pontuação de confiança", completed: true },
      { task: "Criar ciclos de feedback para previsões", completed: true },
      { task: "Implementar tracking de precisão temporal", completed: true }
    ]
  },
  {
    title: "Fase 5: Análise Avançada",
    items: [
      { task: "Melhorar reconhecimento de padrões", completed: true },
      { task: "Implementar análise de correlação avançada", completed: true },
      { task: "Adicionar modelagem estatística avançada", completed: true },
      { task: "Implementar análise de tendências históricas", completed: true }
    ]
  },
  {
    title: "Fase 6: Sincronização Híbrida",
    items: [
      { task: "Implementar sistema offline-first", completed: true },
      { task: "Criar sistema de resolução de conflitos", completed: true },
      { task: "Implementar sincronização em background", completed: true },
      { task: "Criar sistema de filas para operações", completed: true }
    ]
  },
  {
    title: "Fase 7: Monitoramento",
    items: [
      { task: "Implementar métricas de desempenho do modelo", completed: true },
      { task: "Adicionar tracking de taxa de aprendizagem", completed: true },
      { task: "Configurar monitoramento de recursos", completed: true },
      { task: "Implementar tracking de erros", completed: true }
    ]
  },
  {
    title: "Fase 8: Qualidade de Dados",
    items: [
      { task: "Implementar validação de dados", completed: true },
      { task: "Adicionar detecção de outliers", completed: true },
      { task: "Implementar redução de ruído", completed: true },
      { task: "Criar análise de importância de features", completed: true }
    ]
  },
  {
    title: "Fase 9: Longo Prazo",
    items: [
      { task: "Migrar para arquitetura de microsserviços", completed: false },
      { task: "Implementar processamento distribuído", completed: false },
      { task: "Otimizar uso de recursos do sistema", completed: false },
      { task: "Melhorar ciclos de feedback", completed: false }
    ]
  }
];

const databaseImplementationChecklist: ChecklistItem[] = [
  {
    title: "Fase 1: Configuração do Supabase",
    items: [
      { task: "Criar projeto no Supabase", completed: true },
      { task: "Configurar variáveis de ambiente", completed: true },
      { task: "Implementar cliente Supabase", completed: true },
      { task: "Configurar autenticação", completed: true },
      { task: "Definir políticas de segurança (RLS)", completed: true }
    ]
  },
  {
    title: "Fase 2: Modelagem de Dados",
    items: [
      { task: "Criar tabela de jogos históricos", completed: true },
      { task: "Criar tabela de jogadores e linhagens", completed: true },
      { task: "Criar tabela de previsões", completed: true },
      { task: "Criar tabela de métricas de desempenho", completed: true },
      { task: "Implementar triggers para atualizações automáticas", completed: true }
    ]
  },
  {
    title: "Fase 3: Integração com API Oficial",
    items: [
      { task: "Criar job de sincronização com resultados oficiais", completed: true },
      { task: "Implementar cache de resultados", completed: true },
      { task: "Criar sistema de webhooks para atualizações", completed: true },
      { task: "Implementar validação de dados", completed: true }
    ]
  },
  {
    title: "Fase 4: Sistema de Herança Genética",
    items: [
      { task: "Criar modelo de DNA digital", completed: true },
      { task: "Implementar sistema de mutações", completed: true },
      { task: "Criar árvore genealógica de jogadores", completed: true },
      { task: "Implementar tracking de características herdadas", completed: true }
    ]
  },
  {
    title: "Fase 5: Otimização de Performance",
    items: [
      { task: "Implementar cache em múltiplas camadas", completed: true },
      { task: "Configurar índices otimizados", completed: true },
      { task: "Implementar queries materialized", completed: true },
      { task: "Configurar jobs de manutenção", completed: true }
    ]
  },
  {
    title: "Fase 6: Sincronização Híbrida",
    items: [
      { task: "Implementar sistema offline-first", completed: true },
      { task: "Criar sistema de resolução de conflitos", completed: true },
      { task: "Implementar sincronização em background", completed: true },
      { task: "Criar sistema de filas para operações", completed: true }
    ]
  }
];

const ImplementationChecklist = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Checklist de Implementação</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>
          
          <TabsContent value="core">
            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="single" collapsible className="w-full">
                {implementationChecklist.map((phase, phaseIndex) => {
                  const completedTasks = phase.items.filter(item => item.completed).length;
                  const progress = Math.round((completedTasks / phase.items.length) * 100);
                  
                  return (
                    <AccordionItem key={phaseIndex} value={`phase-${phaseIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start">
                          <span>{phase.title}</span>
                          <span className="text-sm text-muted-foreground">
                            Progresso: {progress}% ({completedTasks}/{phase.items.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {phase.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center space-x-2">
                              <Checkbox
                                id={`task-${phaseIndex}-${itemIndex}`}
                                checked={item.completed}
                                disabled
                              />
                              <label
                                htmlFor={`task-${phaseIndex}-${itemIndex}`}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                  item.completed ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {item.task}
                              </label>
                              {item.inProgress && (
                                <span className="text-xs bg-yellow-200 dark:bg-yellow-900 px-2 py-1 rounded">
                                  Em progresso
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="database">
            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="single" collapsible className="w-full">
                {databaseImplementationChecklist.map((phase, phaseIndex) => {
                  const completedTasks = phase.items.filter(item => item.completed).length;
                  const progress = Math.round((completedTasks / phase.items.length) * 100);
                  
                  return (
                    <AccordionItem key={phaseIndex} value={`db-phase-${phaseIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start">
                          <span>{phase.title}</span>
                          <span className="text-sm text-muted-foreground">
                            Progresso: {progress}% ({completedTasks}/{phase.items.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {phase.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center space-x-2">
                              <Checkbox
                                id={`db-task-${phaseIndex}-${itemIndex}`}
                                checked={item.completed}
                                disabled
                              />
                              <label
                                htmlFor={`db-task-${phaseIndex}-${itemIndex}`}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                  item.completed ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {item.task}
                              </label>
                              {item.inProgress && (
                                <span className="text-xs bg-yellow-200 dark:bg-yellow-900 px-2 py-1 rounded">
                                  Em progresso
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImplementationChecklist;

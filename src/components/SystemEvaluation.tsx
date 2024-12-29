import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { modelMonitoring } from '@/utils/monitoring/modelMonitoring';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { performanceMonitor } from '@/utils/performance/performanceMonitor';

const SystemEvaluation = () => {
  const { data: metrics } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: () => {
      const modelMetrics = modelMonitoring.getMetricsSummary();
      const systemStatus = modelMonitoring.getSystemStatus();
      const specializedModels = modelMonitoring.getSpecializedModelsStatus();
      const analysisStatus = modelMonitoring.getAnalysisStatus();
      const dataQuality = modelMonitoring.getDataQualityMetrics();
      const performanceMetrics = performanceMonitor.getAverageMetrics();
      const predictionMetrics = predictionMonitor.getMetrics();

      return {
        modelMetrics,
        systemStatus,
        specializedModels,
        analysisStatus,
        dataQuality,
        performanceMetrics,
        predictionMetrics
      };
    },
    refetchInterval: 5000 // Atualiza a cada 5 segundos
  });

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Saúde do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Status Geral</p>
              <Progress 
                value={metrics.systemStatus.health} 
                className="h-2"
                variant={metrics.systemStatus.health > 90 ? "default" : "destructive"}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.systemStatus.health}% operacional
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Alertas Ativos</p>
              <p className="text-2xl font-bold">{metrics.systemStatus.alerts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho do Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Precisão Média</p>
              <Progress 
                value={metrics.modelMetrics.avgAccuracy * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {(metrics.modelMetrics.avgAccuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total de Amostras</p>
              <p className="text-2xl font-bold">{metrics.modelMetrics.totalSamples}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualidade dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Índice de Qualidade</p>
              <Progress 
                value={metrics.dataQuality.quality * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {(metrics.dataQuality.quality * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Completude</p>
              <Progress 
                value={metrics.dataQuality.completeness * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {(metrics.dataQuality.completeness * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Análises Ativas</p>
              <p className="text-2xl font-bold">{metrics.analysisStatus.activeAnalyses}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {metrics.analysisStatus.active ? 'Em execução' : 'Pausado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelos Especializados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Modelos Ativos</p>
              <p className="text-2xl font-bold">
                {metrics.specializedModels.activeCount}/{metrics.specializedModels.totalCount}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {metrics.specializedModels.active ? 'Operacional' : 'Em manutenção'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métricas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Uso de Memória</p>
              <Progress 
                value={metrics.performanceMetrics.avgMemory * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {(metrics.performanceMetrics.avgMemory * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Latência Média</p>
              <p className="text-sm text-muted-foreground">
                {metrics.performanceMetrics.avgLatency.toFixed(0)}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemEvaluation;
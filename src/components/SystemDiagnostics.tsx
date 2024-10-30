import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceAlerts } from "@/hooks/usePerformanceAlerts";
import { performanceMonitor } from "@/utils/performance/performanceMonitor";
import { modelMonitoring } from "@/utils/monitoring/modelMonitoring";
import { feedbackSystem } from "@/utils/prediction/feedbackSystem";
import DiagnosticResults from './DiagnosticResults';
import { SystemStatus, SpecializedModelsStatus, DataQualityMetrics, AnalysisStatus } from '@/types/monitoring';

export interface DiagnosticResult {
  phase: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const SystemDiagnostics = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  usePerformanceAlerts();

  const getUIComponentCount = () => {
    return document.querySelectorAll('[data-testid], [role]').length;
  };

  const getPerformanceMetrics = () => {
    const metrics = performanceMonitor.getAverageMetrics();
    return {
      avgLatency: metrics.avgLatency || 0,
      avgMemory: metrics.avgMemory || 0,
      avgCPU: metrics.avgCPU || 0
    };
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Fase 1: Gestão de Dados e IA
      const metrics = modelMonitoring.getMetricsSummary();
      diagnosticResults.push({
        phase: "Fase 1: Gestão de Dados e IA",
        status: metrics.avgAccuracy > 0.5 ? 'success' : 'warning',
        message: `Precisão média: ${(metrics.avgAccuracy * 100).toFixed(2)}%`,
        details: `Modelo treinado com ${metrics.totalSamples} amostras`
      });
      setProgress(25);

      // Fase 2: Otimização de Performance
      const perfMetrics = getPerformanceMetrics();
      diagnosticResults.push({
        phase: "Fase 2: Otimização de Performance",
        status: perfMetrics.avgLatency < 1000 ? 'success' : 'warning',
        message: `Latência média: ${perfMetrics.avgLatency.toFixed(2)}ms`,
        details: `CPU: ${perfMetrics.avgCPU.toFixed(1)}%, Memória: ${(perfMetrics.avgMemory / 1024 / 1024).toFixed(1)}MB`
      });
      setProgress(50);

      // Fase 3: Modelos Especializados
      const specializedModels = modelMonitoring.getSpecializedModelsStatus();
      diagnosticResults.push({
        phase: "Fase 3: Modelos Especializados",
        status: specializedModels?.active ? 'success' : 'warning',
        message: "Status dos Modelos Especializados",
        details: `Ativos: ${specializedModels?.activeCount || 0}, Total: ${specializedModels?.totalCount || 0}`
      });
      setProgress(37.5);

      // Fase 4: Validação e Qualidade
      const confidenceCorrelation = feedbackSystem.getConfidenceCorrelation();
      const accuracyTrend = feedbackSystem.getAccuracyTrend();
      diagnosticResults.push({
        phase: "Fase 4: Validação e Qualidade",
        status: confidenceCorrelation > 0.5 ? 'success' : 'warning',
        message: `Correlação de confiança: ${confidenceCorrelation.toFixed(2)}`,
        details: `Tendência de precisão: ${(accuracyTrend[accuracyTrend.length - 1] * 100).toFixed(1)}%`
      });
      setProgress(50);

      // Fase 5: Análise Avançada
      const analysisStatus = modelMonitoring.getAnalysisStatus();
      diagnosticResults.push({
        phase: "Fase 5: Análise Avançada",
        status: analysisStatus?.active ? 'success' : 'warning',
        message: "Status das Análises Avançadas",
        details: `Análises ativas: ${analysisStatus?.activeAnalyses || 0}`
      });
      setProgress(62.5);

      // Fase 6: Experiência do Usuário
      const uiComponents = getUIComponentCount();
      diagnosticResults.push({
        phase: "Fase 6: Experiência do Usuário",
        status: uiComponents > 10 ? 'success' : 'warning',
        message: `${uiComponents} componentes UI detectados`,
        details: "Verificação dos componentes de interface"
      });
      setProgress(75);

      // Fase 7: Monitoramento
      const monitoringStatus = modelMonitoring.getSystemStatus();
      diagnosticResults.push({
        phase: "Fase 7: Monitoramento",
        status: monitoringStatus?.healthy ? 'success' : 'warning',
        message: "Status do Sistema de Monitoramento",
        details: `Saúde: ${monitoringStatus?.health || 0}%, Alertas: ${monitoringStatus?.alerts || 0}`
      });
      setProgress(87.5);

      // Fase 8: Qualidade de Dados
      const dataQuality = modelMonitoring.getDataQualityMetrics();
      diagnosticResults.push({
        phase: "Fase 8: Qualidade de Dados",
        status: dataQuality?.quality > 0.7 ? 'success' : 'warning',
        message: "Qualidade dos Dados",
        details: `Score: ${(dataQuality?.quality * 100).toFixed(1)}%, Completude: ${(dataQuality?.completeness * 100).toFixed(1)}%`
      });
      setProgress(100);

      setResults(diagnosticResults);
    } catch (error) {
      console.error('Erro durante diagnóstico:', error);
      toast({
        title: "Erro no Diagnóstico",
        description: "Ocorreu um erro durante a execução do diagnóstico.",
        variant: "destructive"
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Diagnóstico do Sistema
          <button 
            onClick={runDiagnostics}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            disabled={isRunning}
          >
            Atualizar
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isRunning && (
          <div className="mb-4">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Executando diagnóstico... {progress.toFixed(0)}%
            </p>
          </div>
        )}
        <DiagnosticResults results={results} />
      </CardContent>
    </Card>
  );
};

export default SystemDiagnostics;

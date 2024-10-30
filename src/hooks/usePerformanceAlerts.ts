import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const usePerformanceAlerts = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handlePerformanceAlert = (event: CustomEvent<{
      type: 'accuracy' | 'latency' | 'memory';
      value: number;
    }>) => {
      const { type, value } = event.detail;
      
      const messages = {
        accuracy: {
          title: "Alerta de Precisão",
          description: `A precisão do modelo está baixa: ${(value * 100).toFixed(2)}%`
        },
        latency: {
          title: "Alerta de Latência",
          description: `Tempo de predição alto: ${value.toFixed(2)}ms`
        },
        memory: {
          title: "Alerta de Memória",
          description: `Uso de memória alto: ${(value * 100).toFixed(2)}%`
        }
      };

      toast({
        title: messages[type].title,
        description: messages[type].description,
        variant: "destructive"
      });
    };

    window.addEventListener('performanceAlert', handlePerformanceAlert as EventListener);
    
    return () => {
      window.removeEventListener('performanceAlert', handlePerformanceAlert as EventListener);
    };
  }, [toast]);
};
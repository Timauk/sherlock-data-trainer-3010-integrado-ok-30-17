import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (status !== 'online') {
          setStatus('online');
          console.log('Servidor conectado com sucesso');
        }
      } else {
        throw new Error('Servidor respondeu com erro');
      }
    } catch (error) {
      console.log('Erro ao verificar status do servidor:', error);
      
      if (status !== 'offline') {
        setStatus('offline');
        toast({
          title: "Servidor Indisponível",
          description: "Verifique se o servidor está rodando em localhost:3001",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { 
    status, 
    checkServerStatus
  };
};
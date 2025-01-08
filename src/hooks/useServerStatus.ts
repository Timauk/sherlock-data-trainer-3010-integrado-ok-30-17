import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
        toast({
          title: "Servidor Indisponível",
          description: "Não foi possível conectar ao servidor.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('offline');
      console.error('Erro ao verificar status do servidor:', error);
      toast({
        title: "Erro de Conexão",
        description: "Verifique se o servidor está rodando na porta 3001",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, checkServerStatus };
};
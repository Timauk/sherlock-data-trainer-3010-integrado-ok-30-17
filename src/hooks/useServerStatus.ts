import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
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
      toast({
        title: "Erro de Conexão",
        description: "Por favor, verifique se o servidor está rodando em localhost:3001",
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
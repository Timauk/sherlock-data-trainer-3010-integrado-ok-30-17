import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      // Primeiro tenta o localhost
      const response = await fetch(`${API_URL}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Removido mode: 'cors' e credentials: 'include' que podem causar problemas
      });
      
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
        // Só mostra o toast se realmente mudou para offline
        toast({
          title: "Servidor Indisponível",
          description: "Verifique se o servidor está rodando em localhost:3001",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    // Checa imediatamente ao montar
    checkServerStatus();
    
    // Configura o intervalo para checagem periódica
    const interval = setInterval(checkServerStatus, 30000); // a cada 30 segundos
    
    // Cleanup ao desmontar
    return () => {
      clearInterval(interval);
      console.log('Limpando intervalo de verificação do servidor');
    };
  }, []); // Dependências vazias - só executa ao montar/desmontar

  return { 
    status, 
    checkServerStatus // Expõe a função para permitir checagens manuais
  };
};
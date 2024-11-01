import { useState, useEffect } from 'react';

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  const checkServerStatus = async () => {
    try {
      // Usando a API da Lotofácil diretamente ao invés do servidor local
      const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
      setStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { status };
};
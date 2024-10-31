import { useState, useEffect } from 'react';

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Verifica a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  return { status, checkServerStatus };
};
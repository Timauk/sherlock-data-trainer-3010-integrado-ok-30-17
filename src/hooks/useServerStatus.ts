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
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
        toast({
          title: "Server Unavailable",
          description: "Could not connect to the server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('offline');
      toast({
        title: "Connection Error",
        description: "Please verify if the server is running on localhost:3001",
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
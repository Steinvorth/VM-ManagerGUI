import { useState, useEffect } from 'react';

export function useMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        
        // Use AbortController for timeout management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        // First try the health endpoint
        const healthCheck = await fetch('http://localhost:8000/health', {
          signal: controller.signal
        });
        
        if (!healthCheck.ok) {
          throw new Error('API server is not responding');
        }

        // Then fetch metrics
        const response = await fetch('http://localhost:8000/metrics', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setMetrics(data);
          setError(null);
          setIsLoading(false);
        }
        
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching metrics:', err);
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling every 15 seconds
    const interval = setInterval(fetchMetrics, 15000);

    // Cleanup interval on unmount
    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, []);

  return { metrics, error, isLoading };
}
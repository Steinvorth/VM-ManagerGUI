import { useState, useEffect } from 'react';

export function useMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // First try the health endpoint
        const healthCheck = await fetch('http://localhost:8000/health');
        if (!healthCheck.ok) {
          throw new Error('API server is not responding');
        }

        // Then fetch metrics
        const response = await fetch('http://localhost:8000/metrics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMetrics(data);
        setError(null);
        console.log('Metrics fetched successfully:', data); // Debug log
      } catch (err) {
        console.error('Error fetching metrics:', err); // Debug log
        setError(err.message);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return { metrics, error };
}
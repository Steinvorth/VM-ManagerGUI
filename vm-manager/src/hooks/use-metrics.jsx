import { useState, useEffect } from 'react';

export function useMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling every second
    const interval = setInterval(fetchMetrics, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return { metrics, error };
}
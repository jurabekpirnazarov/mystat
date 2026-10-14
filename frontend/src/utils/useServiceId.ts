import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getServiceIdByRoute } from './serviceMapping';

// Custom hook for getting dynamic service ID
export const useServiceId = () => {
  const location = useLocation();
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceId = async () => {
      try {
        setLoading(true);
        const id = await getServiceIdByRoute(location.pathname);
        setServiceId(id);
      } catch (error) {
        console.error('useServiceId: Error fetching service ID:', error);
        setServiceId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceId();
  }, [location.pathname]);

  return { serviceId, loading };
};
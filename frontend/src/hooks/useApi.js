import { useState, useCallback } from 'react';
import { api } from '../services';
import { useAuth } from './useAuth';

export const useApi = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (method, endpoint, data = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api[method.toLowerCase()](endpoint, data);
      return response;
    } catch (err) {
      setError(err.message || 'API request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint) => callApi('GET', endpoint), [callApi]);
  const post = useCallback((endpoint, data) => callApi('POST', endpoint, data), [callApi]);
  const put = useCallback((endpoint, data) => callApi('PUT', endpoint, data), [callApi]);
  const del = useCallback((endpoint) => callApi('DELETE', endpoint), [callApi]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    callApi
  };
};
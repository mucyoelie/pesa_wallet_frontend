import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * Fetch JSON from the API and keep loading/error state.
 * `path` changes (including filter changes baked into the query string) trigger a
 * refetch, and `reload()` forces one after a mutation.
 */
export function useApiQuery(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    api
      .get(path, { signal: controller.signal })
      .then((payload) => setState({ data: payload, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ data: null, loading: false, error });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, reloadKey, ...deps]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, payload: state.data, reload };
}

export default useApiQuery;

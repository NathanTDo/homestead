import { useCallback, useEffect, useRef, useState } from 'react';

interface Result<T> {
  requestKey: string;
  data: T | null;
  error: boolean;
}

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  /** Fetches again and shows the loading state, e.g. for a "Try again" button. */
  reload: () => void;
  /** Fetches again but keeps showing the current data until the new data arrives. */
  refresh: () => void;
}

/**
 * Runs `fetcher` when `key` changes (or on reload) and tracks loading and error state.
 * `loading` is derived from which request the stored result belongs to, so a stale response
 * from an earlier key is never shown.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, key: string): AsyncData<T> {
  const [attempt, setAttempt] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const fetcherRef = useRef(fetcher);
  const requestKey = `${key}#${attempt}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    fetcherRef
      .current()
      .then((data) => active && setResult({ requestKey, data, error: false }))
      .catch(
        () =>
          active &&
          // A failed refresh keeps the data already on screen.
          setResult((previous) =>
            previous?.requestKey === requestKey && !previous.error
              ? previous
              : { requestKey, data: null, error: true },
          ),
      );
    return () => {
      active = false;
    };
  }, [requestKey, refreshCount]);

  // These must keep the same identity between renders. Effects such as useFocusEffect depend
  // on them, and a new function each render would make those effects run again every render.
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  const current = result?.requestKey === requestKey ? result : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? false,
    reload,
    refresh,
  };
}

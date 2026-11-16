import { useEffect, useRef, useState } from 'react';

interface Result<T> {
  requestKey: string;
  data: T | null;
  error: boolean;
}

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  /** Fetches again, e.g. for a "Try again" button. */
  reload: () => void;
}

/**
 * Runs `fetcher` when `key` changes (or on reload) and tracks loading and error state.
 * `loading` is derived from which request the stored result belongs to, so a stale response
 * from an earlier key is never shown.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, key: string): AsyncData<T> {
  const [attempt, setAttempt] = useState(0);
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
      .catch(() => active && setResult({ requestKey, data: null, error: true }));
    return () => {
      active = false;
    };
  }, [requestKey]);

  const current = result?.requestKey === requestKey ? result : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? false,
    reload: () => setAttempt((n) => n + 1),
  };
}

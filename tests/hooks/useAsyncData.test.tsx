import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useAsyncData } from '../../src/hooks/useAsyncData';

/** A promise the test resolves or rejects itself, so loading states can be observed. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsyncData', () => {
  it('reports loading until the data arrives', async () => {
    const request = deferred<string>();
    const { result } = await renderHook(() => useAsyncData(() => request.promise, 'k'));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => request.resolve('hello'));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('hello');
    expect(result.current.error).toBe(false);
  });

  it('reports an error when the fetch fails', async () => {
    const { result } = await renderHook(() =>
      useAsyncData(() => Promise.reject(new Error('no')), 'k'),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('keeps reload and refresh the same function between renders', async () => {
    const { result, rerender } = await renderHook(() =>
      useAsyncData(() => Promise.resolve(1), 'k'),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { reload, refresh } = result.current;
    await rerender({});
    await rerender({});
    expect(result.current.reload).toBe(reload);
    expect(result.current.refresh).toBe(refresh);
  });

  it('does not loop when an effect depends on refresh (the focus-effect pattern)', async () => {
    const fetcher = jest.fn(() => Promise.resolve('data'));
    let effectRuns = 0;
    const { result } = await renderHook(() => {
      const state = useAsyncData(fetcher, 'k');
      // Mirrors useFocusEffect(useCallback(() => refresh(), [refresh])) on the calendar screen.
      useEffect(() => {
        effectRuns++;
      }, [state.refresh]);
      return state;
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(effectRuns).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refresh fetches again, keeping the old data and no loading state until the new data arrives', async () => {
    const requests = [deferred<string>(), deferred<string>()];
    let call = 0;
    const fetcher = jest.fn(() => requests[call++].promise);
    const { result } = await renderHook(() => useAsyncData(fetcher, 'k'));
    await act(async () => requests[0].resolve('first'));
    expect(result.current.data).toBe('first');

    await act(async () => result.current.refresh());
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('first');

    await act(async () => requests[1].resolve('second'));
    expect(result.current.data).toBe('second');
  });

  it('keeps the old data when a refresh fails', async () => {
    const requests = [deferred<string>(), deferred<string>()];
    let call = 0;
    const fetcher = jest.fn(() => requests[call++].promise);
    const { result } = await renderHook(() => useAsyncData(fetcher, 'k'));
    await act(async () => requests[0].resolve('ok'));
    await act(async () => result.current.refresh());
    await act(async () => requests[1].reject(new Error('x')));
    expect(result.current.data).toBe('ok');
    expect(result.current.error).toBe(false);
  });

  it('reload shows the loading state again and refetches', async () => {
    const requests = [deferred<string>(), deferred<string>()];
    let call = 0;
    const fetcher = jest.fn(() => requests[call++].promise);
    const { result } = await renderHook(() => useAsyncData(fetcher, 'k'));
    await act(async () => requests[0].resolve('x'));
    expect(result.current.loading).toBe(false);

    await act(async () => result.current.reload());
    expect(result.current.loading).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await act(async () => requests[1].resolve('y'));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('y');
  });

  it('refetches when the key changes and never shows data for the old key', async () => {
    const requests: Record<string, ReturnType<typeof deferred<string>>> = {
      a: deferred<string>(),
      b: deferred<string>(),
    };
    const { result, rerender } = await renderHook(
      ({ key }: { key: string }) => useAsyncData(() => requests[key].promise, key),
      { initialProps: { key: 'a' } },
    );
    await act(async () => requests.a.resolve('A'));
    expect(result.current.data).toBe('A');

    await rerender({ key: 'b' });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    await act(async () => requests.b.resolve('B'));
    expect(result.current.data).toBe('B');
  });
});

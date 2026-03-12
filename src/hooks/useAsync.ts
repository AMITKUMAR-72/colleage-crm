import { useState, useCallback } from 'react';

/**
 * useAsync — wraps any async function with automatic loading/error state.
 *
 * Usage:
 *   const { run, loading } = useAsync(myAsyncFn);
 *   <LoadingButton loading={loading} onClick={() => run(args)}>Submit</LoadingButton>
 *
 * Or with a key for per-item loading (e.g. in a list):
 *   const { runWithKey, isLoadingKey } = useAsync(myAsyncFn);
 *   items.map(item => (
 *     <LoadingButton loading={isLoadingKey(item.id)} onClick={() => runWithKey(item.id, item.id)}>
 *       Action
 *     </LoadingButton>
 *   ))
 */
export function useAsync<T = void>(
    fn: (...args: any[]) => Promise<T>
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const run = useCallback(async (...args: any[]): Promise<T | undefined> => {
        setLoading(true);
        setError(null);
        try {
            const result = await fn(...args);
            return result;
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [fn]);

    return { run, loading, error };
}

/**
 * useAsyncMap — tracks loading state per unique key (e.g. per row ID in a table).
 *
 * Usage:
 *   const { runWithKey, isLoadingKey } = useAsyncMap(myAsyncFn);
 *   <button disabled={isLoadingKey(item.id)} onClick={() => runWithKey(item.id, item.id)} />
 */
export function useAsyncMap<T = void>(
    fn: (...args: any[]) => Promise<T>
) {
    const [loadingKeys, setLoadingKeys] = useState<Set<string | number>>(new Set());

    const runWithKey = useCallback(async (key: string | number, ...args: any[]): Promise<T | undefined> => {
        setLoadingKeys(prev => new Set(prev).add(key));
        try {
            const result = await fn(...args);
            return result;
        } catch (err) {
            throw err;
        } finally {
            setLoadingKeys(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }, [fn]);

    const isLoadingKey = useCallback((key: string | number) => loadingKeys.has(key), [loadingKeys]);

    return { runWithKey, isLoadingKey, loadingKeys };
}

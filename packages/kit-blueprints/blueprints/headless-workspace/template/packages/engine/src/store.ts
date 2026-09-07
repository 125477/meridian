/**
 * 无头状态容器。不依赖 UI 框架，便于单测与多端复用。
 */
export type Listener = () => void;

export function createStore<T extends object>(initial: T) {
  let state = { ...initial };
  const listeners = new Set<Listener>();

  return {
    getState(): T {
      return state;
    },
    setState(patch: Partial<T>): void {
      state = { ...state, ...patch };
      for (const listener of listeners) listener();
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type Store<T extends object> = ReturnType<typeof createStore<T>>;

import { createStore } from "../store.js";

export interface AppSnapshot {
  title: string;
  status: "idle" | "ready" | "error";
  message: string;
}

export function createAppModule() {
  const store = createStore<AppSnapshot>({
    title: "Meridian Workspace",
    status: "idle",
    message: "尚未加载",
  });

  return {
    store,
    boot(title: string): void {
      store.setState({ title, status: "ready", message: "工作区已就绪" });
    },
    fail(message: string): void {
      store.setState({ status: "error", message });
    },
  };
}

export type AppModule = ReturnType<typeof createAppModule>;

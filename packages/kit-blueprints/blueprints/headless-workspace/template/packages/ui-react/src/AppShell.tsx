import type { ReactNode } from "react";

export interface AppShellProps {
  title: string;
  sidebar?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** 布局壳。不含业务 store 订阅，由页面层传入内容。 */
export function AppShell({ title, sidebar, actions, children }: AppShellProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: sidebar ? "240px 1fr" : "1fr",
        minHeight: "100vh",
      }}
    >
      {sidebar ? (
        <aside
          style={{
            padding: "24px 20px",
            borderRight: "1px solid var(--line)",
            background: "var(--bg-elevated)",
          }}
        >
          {sidebar}
        </aside>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 28px",
            borderBottom: "1px solid var(--line)",
            background: "var(--bg-elevated)",
          }}
        >
          <strong>{title}</strong>
          <div>{actions}</div>
        </header>
        <main style={{ padding: "28px", flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

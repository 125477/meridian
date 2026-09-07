import type { ReactNode } from "react";

export interface HomePageProps {
  status: string;
  message: string;
  banner: ReactNode;
}

/** 页面接线层：组合 engine 快照与 ui 组件，不把用例写进 ui 包。 */
export function HomePage({ status, message, banner }: HomePageProps) {
  return (
    <section style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      {banner}
      <h1 style={{ margin: 0 }}>主路径已打通</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
        当前状态：{status}。在 <code>packages/engine</code> 扩展用例，在
        <code> packages/ui</code> 扩展展示，在本文件拼接。
      </p>
      <p>{message}</p>
    </section>
  );
}

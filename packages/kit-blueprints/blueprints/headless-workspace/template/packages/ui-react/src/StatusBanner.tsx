import type { ReactNode } from "react";

export interface StatusBannerProps {
  tone?: "neutral" | "danger";
  children: ReactNode;
}

export function StatusBanner({ tone = "neutral", children }: StatusBannerProps) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius)",
        background: tone === "danger" ? "rgba(155,44,44,0.08)" : "var(--bg-elevated)",
        color: tone === "danger" ? "var(--danger)" : "var(--muted)",
        boxShadow: "var(--shadow)",
      }}
    >
      {children}
    </div>
  );
}

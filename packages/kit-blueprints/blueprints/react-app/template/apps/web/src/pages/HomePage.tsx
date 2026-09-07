export function HomePage({ title }: { title: string }) {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 48 }}>
      <h1>{title}</h1>
      <p>单页应用骨架。在此目录继续加路由与页面。</p>
    </main>
  );
}

const url = process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:5173";
const deadline = Date.now() + 30_000;

async function wait() {
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status === 404) return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  console.warn(`web dev server not ready at ${url}, launching anyway`);
}

await wait();

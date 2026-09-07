const doc = document.getElementById("doc");
if (doc) {
  const res = await fetch("/content/index.md");
  doc.textContent = res.ok ? await res.text() : "未找到 content/index.md";
}

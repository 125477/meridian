const pages = [
  { id: "index", title: "概述", href: "/content/index.md" },
  { id: "guide", title: "使用指南", href: "/content/guide.md" },
];

function renderMarkdown(src: string): string {
  return src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

const nav = document.getElementById("nav");
const doc = document.getElementById("doc");

if (nav) {
  nav.innerHTML = pages
    .map((page) => `<button type="button" data-href="${page.href}">${page.title}</button>`)
    .join(" ");
  nav.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const href = target.dataset.href;
    if (href) void loadPage(href);
  });
}

async function loadPage(href: string): Promise<void> {
  if (!doc) return;
  const res = await fetch(href);
  const text = res.ok ? await res.text() : "# 缺少内容";
  doc.innerHTML = `<p>${renderMarkdown(text)}</p>`;
}

void loadPage(pages[0]!.href);

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, inspectProject, resolveFromDescription } from "@meridian/engine";

describe("resolveFromDescription", () => {
  it("maps component library language to ui-library", () => {
    const rec = resolveFromDescription({ description: "做一个 React 组件库" });
    expect(rec.blueprintId).toBe("ui-library");
  });

  it("maps enterprise workspace to headless-workspace", () => {
    const rec = resolveFromDescription({
      description: "企业级前端，无头分层 monorepo",
      platform: "h5",
    });
    expect(rec.blueprintId).toBe("headless-workspace");
    expect(rec.answers.platform).toBe("h5");
  });

  it("maps admin console to react-app", () => {
    const rec = resolveFromDescription({ description: "简单管理后台 dashboard" });
    expect(rec.blueprintId).toBe("react-app");
  });

  it("keeps vue ui and vue rich-text module", () => {
    const rec = resolveFromDescription({
      description: "企业级无头分层，Vue 3，需要富文本编辑器",
    });
    expect(rec.answers.ui).toBe("vue");
    expect(rec.answers.modules).toContain("rich-text");
  });

  it("maps docs portal only when docs site is explicit", () => {
    const rec = resolveFromDescription({ description: "做一个 rspress 技术文档站" });
    expect(rec.blueprintId).toBe("docs-portal");
    expect(rec.answers.withDocs).toBe(true);
  });

  it("does not enable i18n from locale examples", () => {
    const rec = resolveFromDescription({ description: "企业 SaaS，默认 locale 为 zh-CN" });
    expect(rec.answers.withI18n).toBe(false);
  });
});

describe("createProject headless-workspace", () => {
  it("writes a doctor-clean workspace", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-headless-"));
    try {
      const result = await createProject({
        name: "demo-app",
        targetDir: dir,
        blueprintId: "headless-workspace",
        description: "企业级无头分层前端",
        platform: "pc-web",
        force: true,
      });
      expect(result.plan.blueprintId).toBe("headless-workspace");
      expect(result.commit.written).toContain("packages/engine/src/store.ts");
      expect(result.commit.written).toContain("apps/web/src/pages/HomePage.tsx");
      expect(result.commit.written).toContain("apps/web/src/main.tsx");
      expect(result.commit.written.some((f) => f.startsWith("apps/storybook/"))).toBe(false);

      const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8")) as { name: string };
      expect(pkg.name).toBe("demo-app");

      const agents = await readFile(join(dir, "AGENTS.md"), "utf8");
      expect(agents).not.toContain("meridian:section:storybook");

      const report = await inspectProject(dir);
      expect(report.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes i18n and theme files when enabled", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-i18n-"));
    try {
      const result = await createProject({
        name: "i18n-app",
        targetDir: dir,
        blueprintId: "headless-workspace",
        force: true,
        skipFinish: true,
        answers: { withI18n: true, withThemes: true },
      });
      expect(result.commit.written).toContain("packages/ui/src/i18n/config.ts");
      expect(result.commit.written).toContain("packages/ui/src/theme/presets.ts");
      const uiPkg = JSON.parse(await readFile(join(dir, "packages/ui/package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
      };
      expect(uiPkg.dependencies?.i18next).toBeTruthy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes electron shell for desktop", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-desktop-"));
    try {
      const result = await createProject({
        name: "desk-app",
        targetDir: dir,
        blueprintId: "headless-workspace",
        platform: "pc-desktop",
        force: true,
        skipFinish: true,
      });
      expect(result.commit.written).toContain("apps/electron/src/main.ts");
      const report = await inspectProject(dir);
      expect(report.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("generates vue workspace without storybook by default", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-vue-"));
    try {
      const result = await createProject({
        name: "vue-app",
        targetDir: dir,
        blueprintId: "headless-workspace",
        ui: "vue",
        force: true,
        skipFinish: true,
      });
      expect(result.commit.written).toContain("apps/web/src/App.vue");
      expect(result.commit.written).toContain("packages/ui/src/AppShell.ts");
      expect(result.commit.written.some((f) => f.startsWith("apps/storybook/"))).toBe(false);
      expect(result.commit.written.some((f) => f.includes("HomePage.tsx"))).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("generates vue storybook gallery when enabled", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-vue-sb-"));
    try {
      const result = await createProject({
        name: "vue-gallery",
        targetDir: dir,
        blueprintId: "headless-workspace",
        ui: "vue",
        force: true,
        skipFinish: true,
        answers: { withStorybook: true },
      });
      expect(result.commit.written).toContain("apps/storybook/src/main.ts");
      expect(result.commit.written).not.toContain("apps/storybook/src/main.tsx");
      const html = await readFile(join(dir, "apps/storybook/index.html"), "utf8");
      expect(html).toContain("/src/main.ts");
      expect(html).not.toContain("main.tsx");
      const pkg = JSON.parse(await readFile(join(dir, "apps/storybook/package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      expect(pkg.dependencies?.vue).toBeTruthy();
      expect(pkg.devDependencies?.["@vitejs/plugin-vue"]).toBeTruthy();
      expect(pkg.dependencies?.react).toBeUndefined();
      const vite = await readFile(join(dir, "apps/storybook/vite.config.ts"), "utf8");
      expect(vite).toContain("@vitejs/plugin-vue");
      expect(vite).not.toContain("plugin-react");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("injects module dependencies", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-mod-"));
    try {
      await createProject({
        name: "mod-app",
        targetDir: dir,
        blueprintId: "headless-workspace",
        force: true,
        skipFinish: true,
        modules: ["markdown"],
      });
      const uiPkg = JSON.parse(await readFile(join(dir, "packages/ui/package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
      };
      expect(uiPkg.dependencies?.marked).toBeTruthy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("injects vue module dependencies", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-vue-mod-"));
    try {
      await createProject({
        name: "vue-mod",
        targetDir: dir,
        blueprintId: "headless-workspace",
        ui: "vue",
        force: true,
        skipFinish: true,
        modules: ["rich-text", "hooks"],
      });
      const uiPkg = JSON.parse(await readFile(join(dir, "packages/ui/package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
      };
      expect(uiPkg.dependencies?.["@tiptap/vue-3"]).toBeTruthy();
      expect(uiPkg.dependencies?.["@vueuse/core"]).toBeTruthy();
      expect(uiPkg.dependencies?.lexical).toBeUndefined();
      expect(uiPkg.dependencies?.ahooks).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("createProject react-app and ui-library vue", () => {
  it("generates vue spa", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-spa-vue-"));
    try {
      const result = await createProject({
        name: "spa-vue",
        targetDir: dir,
        blueprintId: "react-app",
        ui: "vue",
        force: true,
        skipFinish: true,
      });
      expect(result.commit.written).toContain("apps/web/src/main.ts");
      expect(result.commit.written).toContain("apps/web/src/pages/HomePage.vue");
      expect(result.commit.written).not.toContain("apps/web/src/main.tsx");
      const pkg = JSON.parse(await readFile(join(dir, "apps/web/package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
      };
      expect(pkg.dependencies?.vue).toBeTruthy();
      expect(pkg.dependencies?.react).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("generates vue component library", async () => {
    const dir = await mkdtemp(join(tmpdir(), "meridian-lib-vue-"));
    try {
      const result = await createProject({
        name: "lib-vue",
        targetDir: dir,
        blueprintId: "ui-library",
        ui: "vue",
        force: true,
        skipFinish: true,
      });
      expect(result.commit.written).toContain("packages/ui/src/Label.ts");
      expect(result.commit.written).not.toContain("packages/ui/src/Label.tsx");
      expect(result.commit.written).toContain("apps/storybook/src/main.ts");
      const uiPkg = JSON.parse(await readFile(join(dir, "packages/ui/package.json"), "utf8")) as {
        peerDependencies?: Record<string, string>;
      };
      expect(uiPkg.peerDependencies?.vue).toBeTruthy();
      expect(uiPkg.peerDependencies?.react).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

import type { CreateAnswers } from "@meridian/schema";
import { collectModuleDependencies, loadStackModules } from "../catalog/stack-modules.js";

export interface PackageDepSets {
  uiDependencies: Record<string, string>;
  webDependencies: Record<string, string>;
  webDevDependencies: Record<string, string>;
  storybookDependencies: Record<string, string>;
  storybookDevDependencies: Record<string, string>;
  uiHasRuntimeDeps: boolean;
  isVue: boolean;
  isReact: boolean;
  isDesktop: boolean;
}

export function buildPackageDepSets(
  projectName: string,
  answers: CreateAnswers,
): PackageDepSets {
  const isVue = answers.ui === "vue";
  const isReact = answers.ui === "react";
  const isDesktop = answers.withDesktop || answers.platform === "pc-desktop";
  const modulesConfig = loadStackModules();

  const uiDependencies: Record<string, string> = {
    ...collectModuleDependencies(answers.modules, answers.ui, modulesConfig),
  };
  if (isReact && answers.withI18n) {
    uiDependencies.i18next = "^24.2.2";
    uiDependencies["react-i18next"] = "^15.4.0";
  }
  if (isVue) {
    uiDependencies.vue = "^3.5.13";
    if (answers.withI18n) uiDependencies["vue-i18n"] = "^11.1.2";
  }

  const webDependencies: Record<string, string> = {
    [`@${projectName}/engine`]: "workspace:*",
    [`@${projectName}/ui`]: "workspace:*",
  };
  const webDevDependencies: Record<string, string> = {
    typescript: "^5.7.2",
    vite: "^6.0.6",
  };

  if (isReact) {
    webDependencies.react = "^19.0.0";
    webDependencies["react-dom"] = "^19.0.0";
    webDevDependencies["@types/react"] = "^19.0.2";
    webDevDependencies["@types/react-dom"] = "^19.0.2";
    webDevDependencies["@vitejs/plugin-react"] = "^4.3.4";
  }
  if (isVue) {
    webDependencies.vue = "^3.5.13";
    webDevDependencies["@vitejs/plugin-vue"] = "^5.2.1";
    webDevDependencies["vue-tsc"] = "^2.2.0";
  }
  if (answers.withOptimize) {
    webDevDependencies["vite-plugin-compression"] = "^0.5.1";
    webDevDependencies["rollup-plugin-visualizer"] = "^5.14.0";
  }

  const storybookDependencies: Record<string, string> = {
    [`@${projectName}/ui`]: "workspace:*",
  };
  const storybookDevDependencies: Record<string, string> = {
    typescript: "^5.7.2",
    vite: "^6.0.6",
  };
  if (isReact) {
    storybookDependencies.react = "^19.0.0";
    storybookDependencies["react-dom"] = "^19.0.0";
    storybookDevDependencies["@types/react"] = "^19.0.2";
    storybookDevDependencies["@types/react-dom"] = "^19.0.2";
    storybookDevDependencies["@vitejs/plugin-react"] = "^4.3.4";
  }
  if (isVue) {
    storybookDependencies.vue = "^3.5.13";
    storybookDevDependencies["@vitejs/plugin-vue"] = "^5.2.1";
    storybookDevDependencies["vue-tsc"] = "^2.2.0";
  }

  return {
    uiDependencies,
    webDependencies,
    webDevDependencies,
    storybookDependencies,
    storybookDevDependencies,
    uiHasRuntimeDeps: Object.keys(uiDependencies).length > 0,
    isVue,
    isReact,
    isDesktop,
  };
}

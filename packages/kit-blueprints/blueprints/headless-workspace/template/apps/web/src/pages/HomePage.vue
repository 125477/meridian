<script setup lang="ts">
defineProps<{
  status: string;
  message: string;
}>();
</script>

<template>
  <section style="display: grid; gap: 16px; max-width: 720px">
    <slot />
    <h1 style="margin: 0">主路径已打通</h1>
    <p style="color: var(--muted); line-height: 1.6">
      当前状态：{{ status }}。在 <code>packages/engine</code> 扩展用例，在
      <code>packages/ui</code> 扩展展示，在本文件拼接。
    </p>
    <p>{{ message }}</p>
  </section>
</template>

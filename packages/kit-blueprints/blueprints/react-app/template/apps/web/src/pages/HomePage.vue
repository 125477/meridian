<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <main style="font-family: sans-serif; padding: 48px">
    <h1 v-text="title"></h1>
    <p>单页应用骨架。在此目录继续加路由与页面。</p>
  </main>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  const code = new URLSearchParams(window.location.search).get("code");
  if (code && window.opener) {
    window.opener.postMessage({ code }, window.location.origin);
    window.close();
  }
});
</script>

<template>
  <p>Processando login...</p>
</template>

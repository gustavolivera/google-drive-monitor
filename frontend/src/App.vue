<template>
  <router-view />
  <div class="min-h-screen bg-purple-900 p-4 text-yellow-100">
    <h1 class="text-2xl font-bold pt-5 mb-4 text-center">
      📂 Monitoramento do Google Drive
    </h1>
    <DriveLogs />
  </div>
</template>

<script setup>
import DriveLogs from "./views/DriveLogs.vue";
</script>

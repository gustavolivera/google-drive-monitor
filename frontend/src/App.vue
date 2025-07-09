<template>
  <div>
    <h2>Logs recebidos:</h2>
    <div class="log" v-for="(msg, index) in logs" :key="index">{{ msg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const logs = ref([]);

onMounted(() => {
  const socket = new WebSocket("ws://localhost:3000"); // seu backend websocket

  socket.addEventListener("message", (event) => {
    logs.value.push(event.data);
  });

  socket.addEventListener("open", () => {
    logs.value.push("Conectado ao WebSocket");
  });

  socket.addEventListener("close", () => {
    logs.value.push("Conexão fechada");
  });

  socket.addEventListener("error", (err) => {
    logs.value.push("Erro no WebSocket: " + err.message);
  });
});
</script>

<style>
.log {
  font-family: monospace;
  white-space: pre-wrap;
  margin-bottom: 4px;
  background: #222;
  color: #0f0;
  padding: 6px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
</style>

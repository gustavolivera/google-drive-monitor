<template>
  <div class="text-center">
    <button
      @click="startGoogleAuth"
      class="mb-4 bg-purple-400 px-4 py-2 rounded hover:bg-purple-700"
    >
      {{ isConnected ? "Desconectar" : "Conectar" }}
    </button>

    <div v-if="Object.keys(groupedLogs).length === 0" class="text-center p-4">
      Nenhuma movimentação registrada.
    </div>

    <div
      v-else
      class="space-y-4 text-center bg-purple-300 p-4 rounded max-w-lg mx-auto"
    >
      <div v-for="(anos, cliente) in groupedLogs" :key="cliente">
        <h2
          @click="toggleCliente(cliente)"
          class="text-xl font-semibold cursor-pointer bg-purple-400 p-3 rounded hover:bg-purple-500 max-w-xs mx-auto"
        >
          👤 {{ cliente }}
        </h2>

        <div v-if="openedClientes[cliente]" class="space-y-2">
          <div v-for="(meses, ano) in anos" :key="ano">
            <h3
              @click="toggleAno(cliente, ano)"
              class="text-lg font-medium cursor-pointer bg-purple-400 p-3 m-3 rounded hover:bg-purple-500 max-w-sm mx-auto"
            >
              📅 {{ ano }}
            </h3>

            <div
              v-if="openedAnos[cliente]?.[ano]"
              class="bg-purple-400 p-3 rounded max-w-md mx-auto"
            >
              <div v-for="(logs, mes) in meses" :key="mes" class="">
                <h4 class="font-semibold inline-block">🗓️ {{ mes }}</h4>
                <ul class="list-none text-sm">
                  <li v-for="(log, index) in logs" :key="index" class="w-full">
                    {{ log.timestamp }} — {{ log.mensagem }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";
import axios from "axios";

const apiUrl = import.meta.env.VITE_URL;

const groupedLogs = ref({});
const openedClientes = ref({});
const openedAnos = ref({});
const openedMeses = ref({});

function toggleCliente(cliente) {
  openedClientes.value[cliente] = !openedClientes.value[cliente];
}

function toggleAno(cliente, ano) {
  openedAnos.value[cliente] = openedAnos.value[cliente] || {};
  openedAnos.value[cliente][ano] = !openedAnos.value[cliente][ano];
}

function toggleMes(cliente, ano, mes) {
  openedMeses.value[cliente] = openedMeses.value[cliente] || {};
  openedMeses.value[cliente][ano] = openedMeses.value[cliente][ano] || {};
  openedMeses.value[cliente][ano][mes] = !openedMeses.value[cliente][ano][mes];
}

let socket = null;
const isConnected = ref(false);
let driveChangeRegistered = false;

function toggleConnection() {
  if (isConnected.value) {
    socket.disconnect();
    isConnected.value = false;
    return;
  }

  socket = io("http://localhost:3000");

  socket.on("connect", () => {
    isConnected.value = true;
  });

  if (!driveChangeRegistered) {
    socket.on("driveChange", handleDriveChange);
    driveChangeRegistered = true;
  }

  socket.on("disconnect", () => {
    isConnected.value = false;
  });

  socket.on("connect_error", (error) => {
    isConnected.value = false;
  });
}

function handleDriveChange(data) {
  const { cliente, ano, mes, mensagem, timestamp } = data;

  if (!groupedLogs.value[cliente]) groupedLogs.value[cliente] = {};
  if (!groupedLogs.value[cliente][ano]) groupedLogs.value[cliente][ano] = {};
  if (!groupedLogs.value[cliente][ano][mes])
    groupedLogs.value[cliente][ano][mes] = [];

  groupedLogs.value[cliente][ano][mes].push({ mensagem, timestamp });

  const body = `${cliente} - ${mensagem}`;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    new Notification("📁 Nova movimentação", {
      body,
    });
  }
}

async function startGoogleAuth() {
  try {
    if (isConnected.value) {
      socket.disconnect();
      isConnected.value = false;
      return;
    }
    const response = await axios.get(`${apiUrl}/auth/google/login`);
    const { url, codeVerifier } = response.data;

    const authWindow = window.open(url, "_blank", "width=500,height=600");

    if (!authWindow) {
      return;
    }

    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      const code = event.data.code;
      if (!code) return;

      window.removeEventListener("message", handleMessage);
      authWindow.close();

      try {
        await axios.post(`${apiUrl}/auth/google/callback`, {
          code,
          codeVerifier,
        });

        alert("🎉 Autenticado!");

        toggleConnection();
      } catch (err) {
        alert("Erro ao obter o token de login:", err);
      }
    };

    window.addEventListener("message", handleMessage);
  } catch (error) {
    alert("Erro ao iniciar login:", error);
  }
}
</script>

<style scoped>
ul {
  padding-left: 1rem;
}
</style>

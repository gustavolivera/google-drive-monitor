<template>
  <router-view />
  <div class="widget-container">
    <!-- 🔌 Ícone de conexão -->
    <div
      class="connection-status"
      @click="toggleConnection"
      :title="isConnected ? 'Desconectar' : 'Conectar'"
    >
      <span :class="isConnected ? 'online' : 'offline'">
        {{ isConnected ? "🟢" : "🔴" }}
      </span>
    </div>
    <div
      class="google-auth-icon"
      @click="startGoogleAuth"
      title="Conectar ao Google Drive"
    >
      <img
        src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
        alt="Conectar Google Drive"
        style="cursor: pointer; width: 32px; height: 32px"
      />
    </div>

    <div class="scroll-wrapper">
      <div class="content-area">
        <h2>Movimentações</h2>

        <div
          v-for="(anos, cliente) in groupedLogs"
          :key="cliente"
          class="cliente"
        >
          <div class="section-header" @click="toggleCliente(cliente)">
            {{ cliente }}
          </div>

          <div v-show="openedClientes[cliente]" class="ano-group">
            <div v-for="(meses, ano) in anos" :key="ano" class="ano">
              <div class="section-subheader" @click="toggleAno(cliente, ano)">
                📁 {{ ano }}
              </div>

              <div v-show="openedAnos[cliente]?.[ano]" class="mes-group">
                <div v-for="(mensagens, mes) in meses" :key="mes" class="mes">
                  <div
                    class="section-subsubheader"
                    @click="toggleMes(cliente, ano, mes)"
                  >
                    📂 {{ mes }}
                  </div>

                  <div
                    v-show="openedMeses[cliente]?.[ano]?.[mes]"
                    class="mensagens"
                  >
                    <div v-for="(msg, idx) in mensagens" :key="idx" class="log">
                      {{ msg.timestamp }} - {{ msg.mensagem }}
                    </div>
                  </div>
                </div>
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

  socket.on("driveChange", (data) => {
    const { cliente, ano, mes, mensagem, timestamp } = data;

    if (!groupedLogs.value[cliente]) groupedLogs.value[cliente] = {};
    if (!groupedLogs.value[cliente][ano]) groupedLogs.value[cliente][ano] = {};
    if (!groupedLogs.value[cliente][ano][mes])
      groupedLogs.value[cliente][ano][mes] = [];

    groupedLogs.value[cliente][ano][mes].push({ mensagem, timestamp });
  });

  socket.on("disconnect", () => {
    isConnected.value = false;
  });

  socket.on("connect_error", (error) => {
    isConnected.value = false;
  });
}

async function startGoogleAuth() {
  try {
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

<style>
/* ... seus estilos anteriores ... */
@import url("https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600&display=swap");

* {
  box-sizing: border-box;
}

html,
body {
  font-family: "Quicksand", sans-serif;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #fffde7; /* amarelo pastel bem claro */
  color: #4a4a4a;
  overflow: hidden;
}

#app {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.widget-container {
  background-color: #fff9c4; /* amarelo pastel */
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

h2 {
  color: #6a1b9a; /* roxo escuro */
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 1.3rem;
}

.section-header,
.section-subheader,
.section-subsubheader {
  cursor: pointer;
  font-weight: 600;
  margin-top: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  transition: background 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
}

.section-header {
  background: #f3e5f5; /* roxo pastel claro */
  color: #4a148c;
}
.section-header:hover {
  background: #e1bee7;
}

.section-subheader {
  background: #ede7f6; /* roxo acinzentado */
  color: #512da8;
}
.section-subheader:hover {
  background: #d1c4e9;
}

.section-subsubheader {
  background: #fff8e1; /* amarelo claro */
  color: #f57f17;
}
.section-subsubheader:hover {
  background: #ffecb3;
}

.ano-group,
.mes-group,
.mensagens {
  padding-left: 12px;
}

.log {
  background: #ffffff;
  color: #5e35b1;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 4px 0;
  font-family: "Quicksand", monospace;
  white-space: pre-wrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  font-size: 0.85rem;
  transition: background 0.2s ease;
}

.log:hover {
  background: #f3e5f5;
}

/* Ícone do Google (com hover e efeito suave) */
.google-auth-icon {
  position: absolute;
  top: 50px;
  right: 54px;
  cursor: pointer;
  z-index: 10;
  border-radius: 50%;
  padding: 6px;
  background-color: #f3e5f5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, background 0.3s ease;
}
.google-auth-icon:hover {
  background-color: #e1bee7;
  transform: scale(1.1);
}

.connection-status {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  z-index: 10;
}

.connection-status .online {
  color: #43a047; /* verde */
}

.connection-status .offline {
  color: #e53935; /* vermelho */
}
</style>

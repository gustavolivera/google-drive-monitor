import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  if (command === "serve") {
    // Desenvolvimento
    return {
      plugins: [
        tailwindcss(),
        vue(),
        electron({
          entry: "electron/main.js",
          vite: {
            build: {
              rollupOptions: {
                external: ["electron"],
              },
            },
          },
        }),
      ],
    };
  } else {
    // Build de produção
    return {
      plugins: [
        vue(),
        electron({
          entry: "electron/main.js",
          vite: {
            build: {
              rollupOptions: {
                external: ["electron"],
              },
            },
          },
        }),
      ],
    };
  }
});

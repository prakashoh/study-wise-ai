import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => {
  return {
    plugins: [
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        server: { entry: "server" },
      }),
      command === "build" && nitro({
        defaultPreset: "cloudflare-module",
      }),
      tailwindcss(),
      viteReact(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
    },
    server: {
      host: "::",
      port: 8080,
    },
  };
});

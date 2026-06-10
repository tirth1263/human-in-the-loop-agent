import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/human-in-the-loop-agent/",
  plugins: [react()],
});

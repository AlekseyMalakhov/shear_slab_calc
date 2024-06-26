import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        // globals: true means we may not import  "escribe, expect, it" in every test - vitest provides them
        globals: true,
        setupFiles: "./tests/setup.js",
    },
});

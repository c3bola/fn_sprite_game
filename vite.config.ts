import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    assetsInlineLimit: 0 // Impede que o Vite transforme os sprites em base64
  }
});
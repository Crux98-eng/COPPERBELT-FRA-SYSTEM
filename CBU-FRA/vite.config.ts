import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function figmaAssetResolver() {
  const assetPrefixes = ['figma:asset/', 'asset/'];

  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      const prefix = assetPrefixes.find((assetPrefix) => id.startsWith(assetPrefix));
      if (!prefix) return null;

      const filename = id.slice(prefix.length);
      return path.resolve(__dirname, 'src/assets', filename);
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://fra-backend-vh1s.onrender.com',
        changeOrigin: true,
        secure: true,
        pathRewrite: {
          '^/api': '/api',
        },
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
});

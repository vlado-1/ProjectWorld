import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'src/shims/empty.js'),
      path: path.resolve(__dirname, 'src/shims/empty.js'),
      crypto: path.resolve(__dirname, 'src/shims/empty.js'),
    }
  }
});

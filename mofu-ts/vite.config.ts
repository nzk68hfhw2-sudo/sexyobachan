// Vite の設定ファイル。
// base: "./" にしておくと、ビルド結果（dist/）をどのフォルダに置いても動きます。
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    // TypeScript コンパイラ本体はとても大きい（数MB）ので、警告の基準をゆるめます。
    chunkSizeWarningLimit: 6000,
  },
});

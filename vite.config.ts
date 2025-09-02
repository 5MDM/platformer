import {defineConfig} from "vite";
import {checker} from "vite-plugin-checker";
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  build: {
    target: "es2022",
    assetsInlineLimit: 0
  },
  plugins: [
    checker({
      typescript: true,
    }),
    ViteYaml(),
    /*react({
      devTarget: "es2022",
    }),*/
  ],
  base: "/platformer/",
});
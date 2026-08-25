import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Site de projet GitHub Pages : servi sous /devcremental/, pas à la racine
  // du domaine — seul `build` (utilisé par le déploiement) a besoin de ce
  // préfixe, `dev` reste à la racine pour ne rien changer au flux local.
  base: command === 'build' ? '/devcremental/' : '/',
  plugins: [svelte()],
}))

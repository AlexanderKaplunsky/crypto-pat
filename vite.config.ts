import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// For GitHub Pages project pages: base path should be /repo-name/
// For user/organization pages: base path should be /
const getBasePath = () => {
  const repoName = process.env.GITHUB_PAGES_BASE
  if (repoName && repoName.trim() !== '') {
    const cleanName = repoName.trim().replace(/^\/+|\/+$/g, '')
    return cleanName ? `/${cleanName}/` : '/'
  }
  return '/'
}

export default defineConfig({
  plugins: [react()],
  base: getBasePath(),
  build: {
    outDir: 'dist',
  },
})

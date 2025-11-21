import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// For GitHub Pages project pages: base path should be /repo-name/
// For user/organization pages: base path should be /
// Base path is only applied when GITHUB_PAGES_BASE env var is set (for production builds)
const getBasePath = () => {
  const repoName = process.env.GITHUB_PAGES_BASE
  
  // Only apply base path if explicitly set (for GitHub Pages builds)
  // For dev/preview, this will be undefined, so base path will be '/'
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

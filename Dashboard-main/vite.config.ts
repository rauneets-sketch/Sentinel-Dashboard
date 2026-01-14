import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    build: {
      outDir: 'dist'
    },
    define: {
      // Make environment variables available to the application
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY),
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
      'process.env.PORT': JSON.stringify(env.PORT)
    }
  }
})

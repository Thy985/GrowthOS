import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 启用更激进的代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库单独打包
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          // 将图表库单独打包
          charts: ['recharts'],
          // 将 UI 库单独打包
          ui: ['reactflow'],
          // 将 i18n 单独打包
          i18n: ['i18next', 'react-i18next'],
          // 将 AI 相关单独打包
          ai: ['@reduxjs/toolkit/query', 'idb']
        }
      }
    },
    // 启用更详细的压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 设置更合理的 chunk 大小警告阈值
    chunkSizeWarningLimit: 500
  },
  // 优化开发服务器
  server: {
    port: 3000,
    open: true
  }
})

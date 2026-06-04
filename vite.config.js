import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA 离线优先策略：
// - precache：构建产物（带 hash 的 JS/CSS/HTML）
// - runtime cache：Google Fonts CSS/字体（CacheFirst 1y）
// - navigation fallback：offline.html（未缓存的导航走它）
// - 不缓存 API/业务数据（业务数据由 IndexedDB 管理，不走 SW）
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // 自定义 SW：保留旧的 /offline.html + 添加版本注释
      filename: 'sw.js',
      manifest: {
        name: 'GrowthOS',
        short_name: 'GrowthOS',
        description: 'A personal growth tracking app — fully offline',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Records', short_name: 'Records', url: '/#/records', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }] },
          { name: 'Goals', short_name: 'Goals', url: '/#/goals', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }] },
          { name: 'Analytics', short_name: 'Analytics', url: '/#/analytics', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }] },
        ],
        categories: ['productivity', 'education', 'lifestyle'],
      },
      workbox: {
        // 业务数据不走 SW 缓存（IndexedDB 管理）
        navigateFallback: '/offline.html',
        // 显式排除：所有 API 路径 + 含 /api/ 的请求
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts CSS：StaleWhileRevalidate
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts 字体文件：CacheFirst 1 年
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
      devOptions: {
        // 开发模式下也启用 SW，方便测试离线行为
        enabled: false,
        type: 'module',
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-charts': ['recharts', 'reactflow'],
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    reportCompressedSize: true
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  }
})

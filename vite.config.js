import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5000000, // 5MB limit
        runtimeCaching: [
          // API calls - Network first with fallback
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Static assets - Cache first
          {
            urlPattern: /\.(?:js|css|woff2?|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          // ⚡ SUPABASE STORAGE - Unified cache for all images (FIXED)
          {
            urlPattern: /supabase\.co\/storage/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 500,                   // Max 500 files (uploads + generated)
                maxAgeSeconds: 365 * 24 * 60 * 60, // Cache 1 year
                purgeOnQuotaError: true            // 🔧 Auto-cleanup when quota full
              },
              plugins: [
                {
                  // 🧹 Strip Set-Cookie header (Cloudflare adds it, blocks browser cache)
                  cacheWillUpdate: async ({request, response}) => {
                    console.log('🔵 [SW-CACHE] Storing:', request.url);

                    if (response.headers.has('Set-Cookie')) {
                      console.log('🧹 [SW-CACHE] Stripping Set-Cookie from:', request.url);

                      const headers = new Headers(response.headers);
                      headers.delete('Set-Cookie');

                      return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                      });
                    }

                    return response;
                  },

                  // 📊 Debug logging for cache hits/misses
                  cachedResponseWillBeUsed: async ({request, cachedResponse}) => {
                    if (cachedResponse) {
                      console.log('✅ [SW-CACHE-HIT]:', request.url);
                    } else {
                      console.log('❌ [SW-CACHE-MISS]:', request.url);
                    }
                    return cachedResponse;
                  }
                }
              ],
              cacheableResponse: {
                statuses: [0, 200]                 // Only successful requests
              }
            }
          },
          // Documents and files - Network first
          {
            urlPattern: /\.(?:pdf|doc|docx|txt)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'documents',
              networkTimeoutSeconds: 15,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Elora - AI Asistent',
        short_name: 'Elora',
        description: 'Inteligentní AI asistent s Claude a GPT-4',
        theme_color: '#007bff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/elora.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/elora-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom'],
          // Markdown editor core
          'markdown-editor': ['@uiw/react-md-editor'],
          // Math rendering
          'markdown-math': ['remark-math', 'rehype-katex', 'katex'],
          // Database
          'vendor-db': ['dexie'],
          // Icons and UI
          'vendor-ui': ['lucide-react'],
          // AI and utilities
          'vendor-utils': ['@google/generative-ai']
        }
      }
    }
  }
})

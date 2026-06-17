// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura'

/** Allow large multipart bodies (reports, uploads, voice notes). */
const uploadRouteSecurity = {
  requestSizeLimiter: false,
  xssValidator: false,
} as const

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  nitro: {
    compatibilityDate: '2025-07-29',
    // `ffmpeg-static` puts the binary at install time; Vercel NFT often misses it for `.output`.
    externals: {
      traceInclude: [
        // Bare `ffmpeg-static` resolves to `<cwd>/ffmpeg-static` and breaks NFT — use paths under node_modules.
        'node_modules/ffmpeg-static/index.js',
        'node_modules/ffmpeg-static/ffmpeg',
        'node_modules/ffmpeg-static/ffmpeg.exe'
      ]
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    'nuxt-auth-utils',
    [
      'nuxt-security',
      {
        enabled: true,
        strict: false,
        headers: {
          contentSecurityPolicy: {
            'default-src': ["'self'"],
            'img-src': [
              "'self'",
              'data:',
              'blob:',
              'https://zacc.co.zw',
              'https://www.google-analytics.com',
              'https://maps.googleapis.com',
              'https://maps.gstatic.com',
              'https://*.google.com',
              'https://*.basemaps.cartocdn.com',
              'https://*.tile.openstreetmap.org',
            ],
            'script-src': [
              "'self'",
              "'unsafe-inline'",
              'https://www.googletagmanager.com',
              'https://www.google-analytics.com',
            ],
            'style-src': [
              "'self'",
              "'unsafe-inline'",
              'https://fonts.googleapis.com',
            ],
            'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
            'connect-src': [
              "'self'",
              'https://www.google-analytics.com',
              'https://analytics.google.com',
              'https://region1.google-analytics.com',
              'https://*.basemaps.cartocdn.com',
              'https://*.tile.openstreetmap.org',
            ],
            'frame-src': [
              "'self'",
              'https://www.google.com',
              'https://maps.google.com',
            ],
            'media-src': ["'self'", 'blob:'],
            'upgrade-insecure-requests': true,
          },
          strictTransportSecurity: {
            maxAge: 31536000,
            includeSubdomains: true,
            preload: true,
          },
          xFrameOptions: 'SAMEORIGIN',
          xContentTypeOptions: 'nosniff',
          referrerPolicy: 'strict-origin-when-cross-origin',
          permissionsPolicy: {
            camera: [],
            geolocation: [],
            microphone: [],
            payment: [],
          },
        },
        rateLimiter: {
          tokensPerInterval: 100,
          interval: 300000,
          throwError: true,
        },
        requestSizeLimiter: {
          maxRequestSizeInBytes: 2_000_000,
          maxUploadFileRequestInBytes: 55_000_000,
          throwError: true,
        },
        xssValidator: {
          throwError: true,
        },
        hidePoweredBy: true,
      },
    ],
    'nuxt-gtag',
    '@nuxtjs/seo',
  ],
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }
  },
  routeRules: {
    '/report': {
      security: {
        headers: {
          permissionsPolicy: {
            microphone: ['self'],
          },
        },
      },
    },
    '/api/upload/**': uploadRouteSecurity,
    '/api/public/reports': uploadRouteSecurity,
    '/api/public/reports/**': uploadRouteSecurity,
    '/api/public/jobs/apply': uploadRouteSecurity,
    '/api/public/contact': {
      security: {
        xssValidator: false,
      },
    },
    '/api/content/**': {
      security: {
        xssValidator: false,
      },
    },
    '/api/news/**': {
      security: {
        xssValidator: false,
      },
    },
    '/api/rulings/**': {
      security: {
        xssValidator: false,
      },
    },
    '/api/jobs/**': {
      security: {
        xssValidator: false,
      },
    },
    '/api/citizen-hero/**': {
      security: {
        xssValidator: false,
      },
    },
  },
  css: ['~/assets/css/main.css'],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          cssLayer: false
        }
      }
    },
    components: {
      exclude: [] // Include Editor and Chart components
    }
  },
  // Google Analytics configuration
  gtag: {
    id: 'G-H395XP5RHV',
    config: {
      page_title: 'Zimbabwe Anti-Corruption Commission (ZACC)',
      page_location: 'https://zacc.co.zw'
    }
  },
  // SEO configuration - @nuxtjs/seo uses this site config
  // All SEO modules (sitemap, robots, meta tags, schema.org) share this config
  site: {
    url: 'https://zacc.co.zw',
    name: 'Zimbabwe Anti-Corruption Commission',
    description: 'Zimbabwe Anti-Corruption Commission (ZACC) – Preventing and combating corruption through enforcement, education, and collaboration.',
    defaultLocale: 'en'
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Zimbabwe Anti-Corruption Commission (ZACC)',
      meta: [
        {
          name: 'description',
          content: 'Zimbabwe Anti-Corruption Commission (ZACC) – Preventing and combating corruption through enforcement, education, and collaboration.'
        },
        {
          property: 'og:title',
          content: 'Zimbabwe Anti-Corruption Commission (ZACC)'
        },
        {
          property: 'og:description',
          content: 'Preventing and combating corruption through enforcement, education, and collaboration.'
        },
        {
          property: 'og:type',
          content: 'website'
        },
        {
          property: 'og:url',
          content: 'https://zacc.co.zw'
        },
        {
          property: 'og:image',
          content: 'https://zacc.co.zw/og-image.png'
        },
        {
          property: 'og:site_name',
          content: 'Zimbabwe Anti-Corruption Commission'
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:site',
          content: '@ZACC_Zimbabwe'
        },
        {
          name: 'twitter:title',
          content: 'Zimbabwe Anti-Corruption Commission (ZACC)'
        },
        {
          name: 'twitter:description',
          content: 'Preventing and combating corruption through enforcement, education, and collaboration.'
        },
        {
          name: 'twitter:image',
          content: 'https://zacc.co.zw/og-image.png'
        }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap'
        }
      ]
    }
  }
})

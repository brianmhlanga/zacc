// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    'nuxt-auth-utils',
    'nuxt-gtag',
    '@nuxtjs/seo'
  ],
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }
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

// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@primevue/nuxt-module', 'nuxt-auth-utils'],
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
          content: '/'
        },
        {
          property: 'og:image',
          content: '/og-image.png'
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

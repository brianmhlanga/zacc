<template>
  <Teleport to="body">
    <Transition name="dp">
      <div v-if="visible" class="dp-root" role="presentation">
        <div class="dp-scrim" @click="close('scrim')" />

        <div ref="panel" class="dp-panel" role="dialog" aria-modal="true" :aria-label="title"
          :style="{ width: widthCss }" @keydown="onKeydown">
          <header class="dp-head">
            <div class="min-w-0 flex-1">
              <slot name="header">
                <h2 class="truncate text-lg font-bold text-zaccBlack">{{ title }}</h2>
                <p v-if="subtitle" class="truncate text-sm text-gray-500">{{ subtitle }}</p>
              </slot>
            </div>
            <div class="flex flex-shrink-0 items-center gap-1">
              <slot name="actions" />
              <button ref="closeBtn" type="button" class="dp-close" aria-label="Close" @click="close('button')">
                <i class="pi pi-times" />
              </button>
            </div>
          </header>

          <div class="dp-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="dp-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  subtitle?: string
  /** Any CSS length. The default keeps a usable margin on a phone. */
  width?: string
}>(), { width: 'min(720px, 96vw)' })

const emit = defineEmits<{ 'update:visible': [boolean]; close: [] }>()

const panel = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLElement | null>(null)
const widthCss = computed(() => props.width)

/** Whatever had focus before the drawer opened, so it can be given back. */
let restoreTo: HTMLElement | null = null

const close = (_reason: string) => {
  emit('update:visible', false)
  emit('close')
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Escape is handled at the document, not on the panel: clicking a paragraph
 * inside the drawer leaves `activeElement` on `body`, and a panel-level listener
 * would then never see the key.
 *
 * A PrimeVue overlay (dropdown, date picker) teleports outside the panel and
 * handles its own Escape first, calling preventDefault. Honouring that is what
 * stops one Escape from closing both the menu and the drawer.
 */
const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && !e.defaultPrevented) close('escape')
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Tab' || !panel.value) return

  const items = Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((el) => el.offsetParent !== null || el === document.activeElement)
  if (!items.length) return

  const active = document.activeElement as HTMLElement | null
  // Focus sitting inside a teleported overlay is not ours to manage.
  if (active && !panel.value.contains(active)) return

  const first = items[0]!
  const last = items[items.length - 1]!
  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.visible,
  async (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      restoreTo = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onDocumentKeydown)
      await nextTick()
      closeBtn.value?.focus()
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onDocumentKeydown)
      restoreTo?.focus?.()
      restoreTo = null
    }
  }
)

// A route change or an unmount while open would otherwise leave the page locked
// and the listener attached.
onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<style scoped>
.dp-root {
  position: fixed;
  inset: 0;
  z-index: 1200;
}

.dp-scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
}

.dp-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  background: #f8fafc;
  box-shadow: -8px 0 32px rgba(15, 23, 42, 0.18);
}

.dp-head {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.dp-close {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
}
.dp-close:hover { background: #f1f5f9; color: #0f172a; }
.dp-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(32, 147, 65, 0.25);
}

.dp-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.dp-foot {
  padding: 0.875rem 1.25rem;
  background: #fff;
  border-top: 1px solid #e2e8f0;
}

/* The scrim fades, the panel slides. Both on the same curve so they read as
   one movement. */
.dp-enter-active .dp-scrim,
.dp-leave-active .dp-scrim { transition: opacity 0.2s ease; }
.dp-enter-from .dp-scrim,
.dp-leave-to .dp-scrim { opacity: 0; }

.dp-enter-active .dp-panel,
.dp-leave-active .dp-panel { transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
.dp-enter-from .dp-panel,
.dp-leave-to .dp-panel { transform: translateX(100%); }

@media (prefers-reduced-motion: reduce) {
  .dp-enter-active .dp-panel,
  .dp-leave-active .dp-panel,
  .dp-enter-active .dp-scrim,
  .dp-leave-active .dp-scrim { transition: none; }
}
</style>

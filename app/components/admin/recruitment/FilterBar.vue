<template>
  <div class="mb-4">
    <!-- Layer 1: always visible -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-[400px]">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
        <input
          :value="search"
          type="text"
          :placeholder="searchPlaceholder"
          class="zf-input zf-input--search w-full"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value); $emit('searchInput')"
        />
        <button
          v-if="search"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
          @click="$emit('update:search', ''); $emit('apply')"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </div>

      <slot name="primary" />

      <button
        v-if="$slots.advanced"
        type="button"
        class="zf-btn"
        :class="{ 'zf-btn--active': showAdvanced }"
        @click="showAdvanced = !showAdvanced"
      >
        <i class="pi pi-sliders-h text-sm" />
        <span>More filters</span>
        <span v-if="activeCount" class="zf-count">{{ activeCount }}</span>
      </button>

      <button type="button" class="zf-btn" :disabled="loading" @click="$emit('refresh')">
        <i class="pi pi-refresh text-sm" :class="{ 'zf-spin': loading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- Layer 2: advanced, collapsed by default -->
    <div v-if="showAdvanced && $slots.advanced" class="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <slot name="advanced" />
    </div>

    <!-- Layer 3: what is actually filtering, and how to undo it.
         Without this a three-row result set is a mystery. -->
    <div v-if="chips.length" class="mt-3 flex flex-wrap items-center gap-2">
      <span
        v-for="chip in chips"
        :key="chip.key"
        class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1.5 text-xs"
      >
        <span class="text-gray-500">{{ chip.label }}:</span>
        <span class="font-semibold text-zaccBlack">{{ chip.value }}</span>
        <button
          type="button"
          class="grid h-4 w-4 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-600"
          :aria-label="`Remove ${chip.label} filter`"
          @click="$emit('clear', chip.key)"
        >
          <i class="pi pi-times" style="font-size: 9px" />
        </button>
      </span>
      <button
        type="button"
        class="text-xs font-semibold text-zaccGreen hover:underline"
        @click="$emit('clearAll')"
      >
        Clear all
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface FilterChip {
  key: string
  label: string
  value: string
}

defineProps<{
  search: string
  chips: FilterChip[]
  activeCount: number
  loading?: boolean
  searchPlaceholder?: string
}>()

defineEmits<{
  'update:search': [string]
  searchInput: []
  apply: []
  refresh: []
  clear: [string]
  clearAll: []
}>()

const showAdvanced = ref(false)
</script>

<style scoped>
/* Borrowed from the Parliament backoffice: flat controls, 1px border, a tinted
   focus ring rather than a heavy outline. */
.zf-input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  background: #fff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
/* Room for the leading icon and the trailing clear button. Kept here, not as
   utilities, so nothing depends on which stylesheet the bundler emits first. */
.zf-input--search {
  padding-left: 2.5rem;
  padding-right: 2.25rem;
}

.zf-input:focus {
  border-color: #209341;
  box-shadow: 0 0 0 3px rgba(32, 147, 65, 0.12);
}

.zf-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  background: #fff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.zf-btn:hover:not(:disabled) { border-color: #cbd5e1; }
.zf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.zf-btn--active { border-color: #209341; color: #209341; }

.zf-count {
  background: #209341;
  color: #fff;
  border-radius: 999px;
  padding: 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 1.1rem;
  text-align: center;
}

.zf-spin { animation: zf-spin 1s linear infinite; }
@keyframes zf-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .zf-spin { animation: none; }
}
</style>

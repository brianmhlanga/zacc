<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h4 class="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
      Live eligibility score
    </h4>

    <!-- Ring. PrimeVue Knob is an input, not a display, so this is hand-rolled. -->
    <div class="relative grid place-items-center mb-3">
      <svg viewBox="0 0 120 120" width="112" height="112" class="-rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" stroke-width="9" />
        <circle cx="60" cy="60" r="52" fill="none" :stroke="ringColor" stroke-width="9"
          stroke-linecap="round" :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset" class="transition-all duration-500" />
      </svg>
      <div class="absolute text-center">
        <div class="text-3xl font-extrabold tracking-tight text-zaccBlack">{{ displayScore }}</div>
        <div class="text-[11px] font-semibold text-gray-400">/100</div>
      </div>
    </div>

    <ul class="space-y-1.5 mb-4">
      <li v-for="b in buckets" :key="b.bucket" class="flex items-center justify-between gap-2 text-xs">
        <span class="text-gray-600">{{ bucketLabel(b.bucket) }}</span>
        <span class="font-bold text-zaccBlack whitespace-nowrap">
          {{ b.earned.toFixed(0) }}<span class="font-semibold text-gray-400">/{{ b.weight }}</span>
        </span>
      </li>
    </ul>

    <div v-if="result?.keyword" class="border-t border-gray-200 pt-3">
      <div class="flex justify-between text-xs text-gray-600 mb-1.5">
        <span>Keyword match</span>
        <span class="font-bold text-zaccBlack">{{ result.keyword.percent }}%</span>
      </div>
      <div class="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div class="h-full rounded-full bg-zaccGreen transition-all duration-500"
          :style="{ width: `${result.keyword.percent}%` }" />
      </div>
      <div class="flex flex-wrap gap-1 mt-2">
        <span v-for="k in visibleKeywords" :key="k.keyword"
          class="rounded-full border px-2 py-0.5 text-[10px]"
          :class="k.matched
            ? 'border-green-300 bg-green-50 text-green-800 font-semibold'
            : 'border-gray-200 text-gray-400'">
          {{ k.keyword }}
        </span>
      </div>
    </div>

    <div v-if="pendingCount" class="mt-3 rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-600">
      {{ pendingCount }} criterion(s) are scored by the interview panel and are not counted here.
    </div>

    <!-- Flags and auto-rejection -->
    <div v-if="result?.flags?.length"
      class="mt-3 rounded-lg border p-2.5 text-[11px] font-semibold"
      :class="result.disqualified
        ? 'border-red-300 bg-red-50 text-red-700'
        : 'border-amber-300 bg-amber-50 text-amber-800'">
      <div v-for="f in result.flags" :key="f.key" class="flex gap-1.5 mb-1 last:mb-0">
        <span>⚠</span><span>{{ f.publicReason || f.label }}</span>
      </div>
    </div>

    <p class="mt-3 text-[10px] leading-relaxed text-gray-400">
      Indicative only. Your score is recalculated when you submit, and the panel makes the
      final assessment.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ScoringResult } from '#shared/recruitment/types'

const props = defineProps<{ result: ScoringResult | null }>()

const CIRCUMFERENCE = 2 * Math.PI * 52

const BUCKET_LABELS: Record<string, string> = {
  QUALIFICATIONS_EXPERIENCE: 'Qualifications & experience',
  SKILLS: 'Skills & keywords',
  INTEGRITY: 'Integrity',
  FIT: 'Location & notice'
}
const bucketLabel = (b: string) => BUCKET_LABELS[b] ?? b

const buckets = computed(() => props.result?.bucketScores ?? [])

/**
 * Shows the provisional total — renormalised over resolved criteria — so a
 * candidate is not shown a depressed number just because the panel has not sat
 * yet. Falls back to the raw total when nothing is pending.
 */
const displayScore = computed(() => {
  if (!props.result) return 0
  return Math.round(props.result.provisionalTotal ?? props.result.total)
})

const pendingCount = computed(() => props.result?.manualPending?.length ?? 0)

const ringColor = computed(() => {
  if (props.result?.disqualified) return '#B42318'
  const s = displayScore.value
  if (s >= 70) return '#209341'
  if (s >= 45) return '#D4AF37'
  return '#E5E7EB'
})

const dashOffset = computed(
  () => CIRCUMFERENCE - (Math.min(100, Math.max(0, displayScore.value)) / 100) * CIRCUMFERENCE
)

/** Cap the chip list so the sidebar does not become a wall of tags. */
const visibleKeywords = computed(() => {
  const k = props.result?.keyword
  if (!k) return []
  return [...k.matched, ...k.missed].slice(0, 14)
})
</script>

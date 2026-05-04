<template>
  <NuxtLayout name="dashboard">
    <div class="reports-analytics pb-10">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-zaccGreen">Insights</p>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Report analytics</h1>
          <p class="mt-2 max-w-2xl text-gray-600">
            Geographic hotspots, trends, keyword themes from report text, and breakdowns. Map positions use province reference points from your location dataset.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/admin/reports">
            <Button label="All reports" icon="pi pi-list" severity="secondary" outlined />
          </NuxtLink>
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            :loading="pending"
            style="background: #209341; border-color: #209341"
            @click="refresh"
          />
        </div>
      </div>

      <div v-if="error" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        {{ error }}
      </div>

      <template v-if="pending && !analytics">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton v-for="i in 4" :key="i" height="6rem" class="rounded-2xl" />
        </div>
        <Skeleton class="mt-6 h-[420px] w-full rounded-2xl" />
      </template>

      <template v-else-if="analytics">
        <!-- KPI cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="card in kpiCards"
            :key="card.label"
            class="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-zaccGreen/30 hover:shadow-md"
          >
            <div
              class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] transition group-hover:opacity-[0.12]"
              :class="card.accentClass"
            />
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ card.label }}</p>
            <p class="mt-2 text-3xl font-extrabold text-zaccBlack">{{ card.value }}</p>
            <p v-if="card.hint" class="mt-1 text-xs text-gray-500">{{ card.hint }}</p>
          </div>
        </div>

        <!-- Map -->
        <div
          class="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-zaccBlack">Geographic hotspots</h2>
              <p class="text-xs text-gray-500">Circle size ∝ report count · Province-level placement</p>
            </div>
          </div>
          <div ref="mapContainer" class="h-[min(52vh,520px)] w-full bg-gray-50" />
        </div>

        <!-- Charts grid -->
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <div class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h3 class="text-base font-bold text-zaccBlack">Corruption type</h3>
            <p class="mb-3 text-xs text-gray-500">Volume by category</p>
            <div class="relative h-72 w-full">
              <canvas ref="chartTypesEl" />
            </div>
          </div>
          <div class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h3 class="text-base font-bold text-zaccBlack">Status pipeline</h3>
            <p class="mb-3 text-xs text-gray-500">Current workflow state</p>
            <div class="relative h-72 w-full">
              <canvas ref="chartStatusEl" />
            </div>
          </div>
          <div class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h3 class="text-base font-bold text-zaccBlack">Priority mix</h3>
            <p class="mb-3 text-xs text-gray-500">How urgency is distributed</p>
            <div class="relative mx-auto h-64 max-w-xs">
              <canvas ref="chartPriorityEl" />
            </div>
          </div>
          <div class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h3 class="text-base font-bold text-zaccBlack">Submission trend</h3>
            <p class="mb-3 text-xs text-gray-500">Reports per month (last 12 months)</p>
            <div class="relative h-72 w-full">
              <canvas ref="chartTrendEl" />
            </div>
          </div>
        </div>

        <!-- Keywords -->
        <div class="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-5 py-4">
            <h3 class="text-lg font-bold text-zaccBlack">Top keywords</h3>
            <p class="text-xs text-gray-500">
              Word frequency from the {{ analytics.keywordSampleReportCount.toLocaleString() }} most recent reports
              (description, additional notes, people involved, and location). Common filler words are excluded.
            </p>
          </div>
          <div v-if="!analytics.keywords?.length" class="px-5 py-10 text-center text-sm text-gray-500">
            Not enough text yet to derive keywords.
          </div>
          <div v-else class="px-5 py-5">
            <div class="flex flex-wrap items-baseline gap-2 gap-y-3">
              <span
                v-for="kw in analytics.keywords"
                :key="kw.word"
                class="inline-flex items-baseline rounded-full border border-zaccGreen/20 bg-zaccGreen/[0.06] px-3 py-1.5 text-zaccBlack"
                :style="keywordChipStyle(kw.count)"
              >
                <span class="font-semibold capitalize tracking-tight">{{ kw.word }}</span>
                <span class="ml-1.5 tabular-nums text-xs font-medium text-zaccBlack/55">{{ kw.count }}</span>
              </span>
            </div>
            <div class="mt-6 overflow-x-auto rounded-xl border border-gray-100">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th class="px-4 py-2">Keyword</th>
                    <th class="px-4 py-2 text-right">Mentions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="kw in analytics.keywords" :key="`row-${kw.word}`" class="hover:bg-gray-50/80">
                    <td class="px-4 py-2 font-medium capitalize text-zaccBlack">{{ kw.word }}</td>
                    <td class="px-4 py-2 text-right tabular-nums text-gray-700">{{ kw.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Province table -->
        <div class="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-5 py-4">
            <h3 class="text-lg font-bold text-zaccBlack">Top provinces</h3>
            <p class="text-xs text-gray-500">Ranked by report count</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-5 py-3">#</th>
                  <th class="px-5 py-3">Province</th>
                  <th class="px-5 py-3 text-right">Reports</th>
                  <th class="px-5 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(row, idx) in topProvinces" :key="row.province ?? 'null'" class="hover:bg-gray-50/80">
                  <td class="px-5 py-3 text-gray-400">{{ idx + 1 }}</td>
                  <td class="px-5 py-3 font-medium text-zaccBlack">
                    {{ row.label }}
                  </td>
                  <td class="px-5 py-3 text-right font-semibold tabular-nums">{{ row.count }}</td>
                  <td class="px-5 py-3 text-right text-gray-600 tabular-nums">{{ row.pct }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import type { ChartConfiguration } from 'chart.js'

useHead({
  title: 'Report analytics - ZACC CMS',
  meta: [{ name: 'description', content: 'Corruption report analytics, map hotspots, and trends.' }]
})

definePageMeta({
  middleware: 'admin'
})

interface Hotspot {
  slug: string
  label: string
  lat: number
  lng: number
  count: number
  approximate?: boolean
}

interface AnalyticsData {
  summary: {
    total: number
    anonymousCount: number
    identifiedCount: number
    anonymousRate: number
    withAudio: number
    withFiles: number
    withAudioRate: number
    withFilesRate: number
    newReportsLast30Days: number
    closedOrArchivedTotal: number
  }
  byStatus: { key: string; count: number }[]
  byPriority: { key: string; count: number }[]
  byCorruptionType: { key: string; count: number }[]
  byProvince: { province: string | null; count: number }[]
  volumeByMonth: { key: string; label: string; count: number }[]
  mapHotspots: Hotspot[]
  keywords: { word: string; count: number }[]
  keywordSampleReportCount: number
}

const toast = useToast()
const analytics = ref<AnalyticsData | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)

const mapContainer = ref<HTMLElement | null>(null)
const chartTypesEl = ref<HTMLCanvasElement | null>(null)
const chartStatusEl = ref<HTMLCanvasElement | null>(null)
const chartPriorityEl = ref<HTMLCanvasElement | null>(null)
const chartTrendEl = ref<HTMLCanvasElement | null>(null)

let mapInstance: import('leaflet').Map | null = null
let leafletLayerGroup: import('leaflet').LayerGroup | null = null
const chartInstances: Array<{ destroy: () => void }> = []

function formatTypeLabel(key: string) {
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatStatusLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const kpiCards = computed(() => {
  const s = analytics.value?.summary
  if (!s) return []
  return [
    {
      label: 'Total reports',
      value: s.total.toLocaleString(),
      hint: `${s.newReportsLast30Days.toLocaleString()} in the last 30 days`,
      accentClass: 'bg-zaccGreen'
    },
    {
      label: 'Closed / archived',
      value: s.closedOrArchivedTotal.toLocaleString(),
      hint: 'Historical resolutions',
      accentClass: 'bg-zaccGold'
    },
    {
      label: 'Anonymous share',
      value: `${s.anonymousRate}%`,
      hint: `${s.anonymousCount.toLocaleString()} anonymous · ${s.identifiedCount.toLocaleString()} identified`,
      accentClass: 'bg-emerald-700'
    },
    {
      label: 'With attachments',
      value: `${s.withFilesRate}%`,
      hint: `${s.withAudioRate}% include a voice note`,
      accentClass: 'bg-teal-600'
    }
  ]
})

const topProvinces = computed(() => {
  const rows = analytics.value?.byProvince ?? []
  const total = analytics.value?.summary.total || 1
  return rows.slice(0, 12).map((r) => ({
    province: r.province,
    label: r.province ? formatTypeLabel(r.province) : 'Not specified',
    count: r.count,
    pct: Math.round((r.count / total) * 1000) / 10
  }))
})

const maxKeywordCount = computed(() => {
  const list = analytics.value?.keywords ?? []
  return Math.max(...list.map((k) => k.count), 1)
})

function keywordChipStyle(count: number) {
  const max = maxKeywordCount.value
  const t = max ? count / max : 1
  const rem = 0.8 + t * 0.35
  return { fontSize: `${rem}rem` }
}

async function load() {
  pending.value = true
  error.value = null
  try {
    analytics.value = await $fetch<AnalyticsData>('/api/reports/analytics')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to load analytics'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 4000 })
  } finally {
    pending.value = false
  }
}

async function refresh() {
  await load()
  await nextTick()
  renderVisuals()
}

function destroyCharts() {
  while (chartInstances.length) {
    chartInstances.pop()?.destroy()
  }
}

function destroyMap() {
  leafletLayerGroup?.remove()
  leafletLayerGroup = null
  mapInstance?.remove()
  mapInstance = null
}

function renderMap(L: typeof import('leaflet').default, data: AnalyticsData) {
  const el = mapContainer.value
  if (!el) return
  destroyMap()

  mapInstance = L.map(el, {
    scrollWheelZoom: true,
    attributionControl: true
  }).setView([-19.015438, 29.154857], 6)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance)

  leafletLayerGroup = L.layerGroup().addTo(mapInstance)
  const max = Math.max(...data.mapHotspots.map((h) => h.count), 1)

  for (const h of data.mapHotspots) {
    const t = h.count / max
    const radius = 10 + t * 34
    const fill = h.approximate ? 'rgba(212, 175, 55, 0.55)' : 'rgba(32, 147, 65, 0.5)'
    const stroke = h.approximate ? '#b45309' : '#14532d'
    const c = L.circleMarker([h.lat, h.lng], {
      radius,
      color: stroke,
      weight: 2,
      fillColor: fill,
      fillOpacity: 0.85
    })
    c.bindPopup(
      `<div style="min-width:140px;font-family:system-ui,sans-serif">
        <div style="font-weight:700;margin-bottom:4px">${escapeHtml(h.label)}</div>
        <div style="font-size:13px;color:#444">${h.count} report(s)</div>
        ${h.approximate ? '<div style="font-size:11px;color:#92400e;margin-top:4px">Approximate position</div>' : ''}
      </div>`
    )
    c.addTo(leafletLayerGroup)
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const chartColors = {
  primary: '#209341',
  accent: '#d4af37',
  series: ['#209341', '#d4af37', '#0f766e', '#166534', '#ca8a04', '#0369a1', '#7c3aed', '#b45309', '#64748b']
}

function renderCharts(
  ChartJS: (typeof import('chart.js/auto'))['default'],
  data: AnalyticsData
) {
  destroyCharts()
  const defaultOpts: Partial<ChartConfiguration> = {
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } }
        }
      }
    }
  }

  if (chartTypesEl.value && data.byCorruptionType.length) {
    const ch = new ChartJS(chartTypesEl.value, {
      type: 'bar',
      data: {
        labels: data.byCorruptionType.map((x) => formatTypeLabel(x.key)),
        datasets: [
          {
            label: 'Reports',
            data: data.byCorruptionType.map((x) => x.count),
            backgroundColor: data.byCorruptionType.map((_, i) => chartColors.series[i % chartColors.series.length]),
            borderRadius: 8
          }
        ]
      },
      options: {
        ...defaultOpts.options,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { precision: 0 } },
          y: { grid: { display: false } }
        }
      }
    })
    chartInstances.push(ch)
  }

  if (chartStatusEl.value && data.byStatus.length) {
    const ch = new ChartJS(chartStatusEl.value, {
      type: 'bar',
      data: {
        labels: data.byStatus.map((x) => formatStatusLabel(x.key)),
        datasets: [
          {
            label: 'Count',
            data: data.byStatus.map((x) => x.count),
            backgroundColor: 'rgba(32, 147, 65, 0.75)',
            borderRadius: 6
          }
        ]
      },
      options: {
        ...defaultOpts.options,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { precision: 0 } }
        }
      }
    })
    chartInstances.push(ch)
  }

  if (chartPriorityEl.value && data.byPriority.length) {
    const ch = new ChartJS(chartPriorityEl.value, {
      type: 'doughnut',
      data: {
        labels: data.byPriority.map((x) => x.key),
        datasets: [
          {
            data: data.byPriority.map((x) => x.count),
            backgroundColor: chartColors.series,
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },
      options: {
        ...defaultOpts.options,
        cutout: '58%',
        plugins: { legend: { position: 'bottom' } }
      }
    })
    chartInstances.push(ch)
  }

  if (chartTrendEl.value && data.volumeByMonth.length) {
    const ch = new ChartJS(chartTrendEl.value, {
      type: 'line',
      data: {
        labels: data.volumeByMonth.map((x) => x.label),
        datasets: [
          {
            label: 'Reports',
            data: data.volumeByMonth.map((x) => x.count),
            borderColor: chartColors.primary,
            backgroundColor: 'rgba(32, 147, 65, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: chartColors.accent
          }
        ]
      },
      options: {
        ...defaultOpts.options,
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { precision: 0 } }
        }
      }
    })
    chartInstances.push(ch)
  }
}

async function renderVisuals() {
  const data = analytics.value
  if (!data || !import.meta.client) return
  const [leafletMod, chartMod] = await Promise.all([import('leaflet'), import('chart.js/auto')])
  const L = leafletMod.default
  const ChartJS = chartMod.default
  await nextTick()
  renderMap(L, data)
  renderCharts(ChartJS, data)
}

onMounted(async () => {
  await load()
  await renderVisuals()
})

onBeforeUnmount(() => {
  destroyMap()
  destroyCharts()
})
</script>

<style>
@import 'leaflet/dist/leaflet.css';
</style>

<style scoped>
.reports-analytics :deep(.leaflet-container) {
  font-family: inherit;
  z-index: 0;
}
</style>

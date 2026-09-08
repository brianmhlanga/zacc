/**
 * Shared behaviour for server-paginated admin tables: URL-backed filters,
 * sorting, paging, and race-safe fetching.
 *
 * The race protection is the reason this exists. Typing in a search box fires a
 * request per keystroke, and without a guard an earlier response can paint over
 * a later one — which on a shortlisting table means a reviewer acts on rows that
 * do not match the filters on screen.
 *
 * Modelled on the equivalent in the Parliament e-portal, whose comment explains
 * why one guard is not enough.
 */
import type { LocationQueryRaw } from 'vue-router'
import { createRequestGuard } from '~/utils/requestGuard'

export interface TableQueryOptions<TFilters extends Record<string, any>> {
  /** Endpoint to fetch. Receives the serialised query. */
  endpoint: string
  /** Starting filter values. Anything equal to these is omitted from the URL. */
  defaults: TFilters
  pageSize?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  /** Reads rows and total out of the response shape. */
  transform?: (data: any) => { rows: any[]; total: number; extra?: Record<string, any> }
  /** Sync filter state to the address bar. */
  syncUrl?: boolean
}

export function useTableQuery<TFilters extends Record<string, any>>(
  opts: TableQueryOptions<TFilters>
) {
  const route = useRoute()
  const router = useRouter()

  const rows = ref<any[]>([])
  const total = ref(0)
  const extra = ref<Record<string, any>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const pageSize = ref(opts.pageSize ?? 25)
  const sortField = ref(opts.sortField ?? 'createdAt')
  const sortOrder = ref<'asc' | 'desc'>(opts.sortOrder ?? 'desc')

  // Hydrate from the URL so a filtered view survives a reload or a shared link.
  const initial = { ...opts.defaults } as TFilters
  if (opts.syncUrl !== false) {
    for (const key of Object.keys(opts.defaults)) {
      const q = route.query[key]
      if (q === undefined) continue
      const def = (opts.defaults as any)[key]
      ;(initial as any)[key] =
        typeof def === 'boolean' ? q === 'true'
          : typeof def === 'number' ? Number(q)
            : Array.isArray(def) ? (Array.isArray(q) ? q : [q])
              : q
    }
    if (route.query.page) page.value = Math.max(1, Number(route.query.page) || 1)
  }
  const filters = reactive(initial) as TFilters

  const isDefault = (key: string) => {
    const a = (filters as any)[key]
    const b = (opts.defaults as any)[key]
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i])
    return a === b || a === '' || a === null || a === undefined
  }

  const activeFilterKeys = computed(() => Object.keys(opts.defaults).filter((k) => !isDefault(k)))
  const activeFilterCount = computed(() => activeFilterKeys.value.length)
  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  /** Only non-defaults are serialised, so a clean view has a clean URL. */
  const currentQuery = computed(() => {
    const q: Record<string, any> = {}
    for (const key of activeFilterKeys.value) q[key] = (filters as any)[key]
    return q
  })

  // See app/utils/requestGuard.ts — the stale-result guard lives there so it is
  // unit-tested rather than duplicated inline.
  const guard = createRequestGuard()

  const load = async () => {
    loading.value = true
    error.value = null

    const result = await guard.run((signal) =>
      $fetch<any>(opts.endpoint, {
        params: {
          ...currentQuery.value,
          page: page.value,
          pageSize: pageSize.value,
          sortField: sortField.value,
          sortOrder: sortOrder.value
        },
        signal
      })
    )

    // Superseded or aborted: a newer request owns the state and the spinner.
    if (result.status === 'superseded' || result.status === 'aborted') return

    if (result.status === 'failed') {
      error.value = (result.error as any)?.data?.statusMessage || 'Could not load this list'
      loading.value = false
      return
    }

    const data = result.value
    const shaped = opts.transform
      ? opts.transform(data)
      : { rows: data.rows ?? [], total: data.total ?? 0, extra: data }
    rows.value = shaped.rows
    total.value = shaped.total
    extra.value = shaped.extra ?? data
    loading.value = false
  }

  const syncUrl = () => {
    if (opts.syncUrl === false) return
    const query: LocationQueryRaw = { ...currentQuery.value }
    if (page.value > 1) query.page = String(page.value)
    // replace, not push — adjusting a filter should not become a back-button step.
    router.replace({ query }).catch(() => {})
  }

  const applyFilters = () => {
    page.value = 1
    syncUrl()
    load()
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const applyFiltersDebounced = (wait = 300) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(applyFilters, wait)
  }

  const setPage = (n: number) => { page.value = Math.max(1, n); syncUrl(); load() }
  const setPageSize = (n: number) => { pageSize.value = n; page.value = 1; syncUrl(); load() }

  const setSort = (field: string, order?: 'asc' | 'desc') => {
    if (order) {
      sortField.value = field
      sortOrder.value = order
    } else if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'desc'
    }
    page.value = 1
    load()
  }

  const clearFilter = (key: string) => {
    ;(filters as any)[key] = (opts.defaults as any)[key]
    applyFilters()
  }

  const clearAll = () => {
    Object.assign(filters, opts.defaults)
    applyFilters()
  }

  onBeforeUnmount(() => {
    guard.cancel()
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return {
    rows, total, extra, loading, error,
    page, pageSize, sortField, sortOrder, filters,
    activeFilterKeys, activeFilterCount, hasActiveFilters, currentQuery,
    load, applyFilters, applyFiltersDebounced,
    setPage, setPageSize, setSort, clearFilter, clearAll
  }
}

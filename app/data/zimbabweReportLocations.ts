/**
 * Zimbabwe location hierarchy for corruption report forms (province → district → place).
 * Data is loaded from `zimbabwe_provinces_districts_places_nested.json`.
 */

import locationData from './zimbabwe_provinces_districts_places_nested.json'

export const REPORT_LOCATION_OTHER = 'Other (specify below)'

/** Province value stored on reports / used in dropdowns (slug derived from JSON province name). */
export type ZimbabweProvinceSlug = string

export interface ZimbabweDistrict {
  name: string
}

export interface ZimbabweProvince {
  label: string
  value: ZimbabweProvinceSlug
  districts: ZimbabweDistrict[]
}

interface PlaceJson {
  name: string
  type?: string
  latitude?: number | null
  longitude?: number | null
}

interface DistrictJson {
  name: string
  places?: PlaceJson[]
}

interface ProvinceJson {
  name: string
  districts?: DistrictJson[]
}

interface LocationsRoot {
  provinces: ProvinceJson[]
}

const root = locationData as LocationsRoot

/** Match existing report slugs: lowercase, hyphenated (e.g. Mashonaland Central → mashonaland-central). */
export function slugifyProvinceName(name: string): ZimbabweProvinceSlug {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const provinceBySlug = new Map<string, ProvinceJson>()
for (const p of root.provinces ?? []) {
  provinceBySlug.set(slugifyProvinceName(p.name), p)
}

export const zimbabweReportProvinces: ZimbabweProvince[] = (root.provinces ?? []).map((p) => ({
  label: p.name,
  value: slugifyProvinceName(p.name),
  districts: (p.districts ?? []).map((d) => ({ name: d.name }))
}))

export function getDistrictsForProvince(slug: ZimbabweProvinceSlug | null): ZimbabweDistrict[] {
  if (!slug) return []
  const p = provinceBySlug.get(slug)
  return (p?.districts ?? []).map((d) => ({ name: d.name }))
}

export function getPlacesForDistrict(
  provinceSlug: ZimbabweProvinceSlug | null,
  districtName: string | null
): string[] {
  if (!provinceSlug || !districtName) return []
  const p = provinceBySlug.get(provinceSlug)
  const d = p?.districts?.find((x) => x.name === districtName)
  const raw = (d?.places ?? []).map((pl) => pl.name).filter(Boolean)

  const seen = new Set<string>()
  const unique: string[] = []
  for (const n of raw) {
    if (seen.has(n)) continue
    seen.add(n)
    unique.push(n)
  }

  const trimmed = [...unique]
  while (trimmed.length && /other/i.test(trimmed[trimmed.length - 1]!)) {
    trimmed.pop()
  }

  if (!trimmed.length) {
    return [`${districtName} (main centre / town)`, REPORT_LOCATION_OTHER]
  }

  return [...trimmed, REPORT_LOCATION_OTHER]
}

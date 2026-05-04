import zimJson from '../../app/data/zimbabwe_provinces_districts_places_nested.json'

function slugifyProvinceName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

type ProvinceJson = {
  name: string
  latitude?: number | null
  longitude?: number | null
}

type Root = { provinces?: ProvinceJson[] }

const root = zimJson as Root

/** Province slug → reference point (same slug rules as public report form). */
export const provinceCentroidBySlug: Record<string, { lat: number; lng: number; label: string }> = {}

for (const p of root.provinces ?? []) {
  const lat = p.latitude
  const lng = p.longitude
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    provinceCentroidBySlug[slugifyProvinceName(p.name)] = { lat, lng, label: p.name }
  }
}

export function centroidForProvinceSlug(slug: string | null | undefined): {
  lat: number
  lng: number
  label: string
} | null {
  if (!slug) return null
  return provinceCentroidBySlug[slug] ?? null
}

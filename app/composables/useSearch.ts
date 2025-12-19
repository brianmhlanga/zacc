export const useSearch = () => {
  const setupSearch = (inputId: string, cardSelector: string) => {
    if (process.client) {
      const searchInput = document.getElementById(inputId) as HTMLInputElement
      if (!searchInput) return

      const cards = Array.from(document.querySelectorAll<HTMLElement>(cardSelector))
      searchInput.addEventListener('input', (e) => {
        const query = ((e.target as HTMLInputElement).value || '').toLowerCase().trim()
        cards.forEach((card) => {
          const title = (card.getAttribute('data-title') || '').toLowerCase()
          const body = (card.getAttribute('data-body') || '').toLowerCase()
          const match = !query || title.includes(query) || body.includes(query)
          card.classList.toggle('hidden', !match)
        })
      })
    }
  }

  return { setupSearch }
}

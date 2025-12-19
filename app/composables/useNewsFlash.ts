export const useNewsFlash = () => {
  const startNewsFlash = (textElementId: string, dataElementId: string) => {
    if (process.client) {
      const newsFlashText = document.getElementById(textElementId)
      if (!newsFlashText) return

      const dataEls = document.querySelectorAll<HTMLElement>(`#${dataElementId} .flash-item`)
      const defaults = [
        'Court upholds asset seizure in landmark case',
        'Compliance monitoring initiative launches nationwide',
        'Stakeholder engagement strengthens integrity systems',
      ]
      const items =
        dataEls.length > 0
          ? Array.from(dataEls)
              .map((el) => el.textContent?.trim())
              .filter(Boolean)
          : defaults

      let idx = 0
      if (items.length > 0) {
        newsFlashText.textContent = items[0] || ''
        setInterval(() => {
          idx = (idx + 1) % items.length
          newsFlashText.textContent = items[idx] || ''
        }, 4000)
      }
    }
  }

  return { startNewsFlash }
}

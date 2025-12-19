export const useHeroSlides = () => {
  const startSlideshow = (containerId: string) => {
    if (process.client) {
      const container = document.getElementById(containerId)
      if (!container) return

      const slideImgs = container.querySelectorAll<HTMLImageElement>('img')
      if (!slideImgs.length) return

      let activeIdx = 0
      setInterval(() => {
        const current = slideImgs[activeIdx]
        if (current) {
          current.classList.remove('opacity-100')
          current.classList.add('opacity-0')
        }
        activeIdx = (activeIdx + 1) % slideImgs.length
        const next = slideImgs[activeIdx]
        if (next) {
          next.classList.remove('opacity-0')
          next.classList.add('opacity-100')
        }
      }, 5000)
    }
  }

  return { startSlideshow }
}

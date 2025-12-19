export const useCountUp = () => {
  const animateCount = (
    el: HTMLElement,
    target: number,
    prefix = '',
    suffix = '',
    duration = 1200
  ) => {
    const startTime = performance.now()
    const startValue = 0
    const formatter = new Intl.NumberFormat('en-US')

    function frame(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const value = Math.floor(startValue + (target - startValue) * progress)
      if (el) {
        el.textContent = `${prefix}${formatter.format(value)}${suffix}`
      }
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  const observeStats = (selector = '.countup') => {
    if (process.client) {
      const statEls = document.querySelectorAll<HTMLElement>(selector)
      if (!statEls.length) return

      const seen = new WeakSet<HTMLElement>()
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !seen.has(entry.target as HTMLElement)) {
              seen.add(entry.target as HTMLElement)
              const el = entry.target as HTMLElement
              const target = parseFloat(el.getAttribute('data-target') || '0')
              const prefix = el.getAttribute('data-prefix') || ''
              const suffix = el.getAttribute('data-suffix') || ''
              animateCount(el, target, prefix, suffix)
            }
          })
        },
        { threshold: 0.4 }
      )
      statEls.forEach((el) => io.observe(el))
    }
  }

  return { observeStats, animateCount }
}

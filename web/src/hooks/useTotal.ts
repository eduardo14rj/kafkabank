import { useEffect, useState } from 'react'

export function useTotal() {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/total')
        const data = (await res.json()) as { total: number }
        if (active) setTotal(data.total)
      } catch {
        // gateway fora do ar: mantém o último valor
      }
    }

    load()
    const timer = setInterval(load, 1000) // consulta a cada 1s

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return total
}
import { useEffect, useRef, useState } from 'react'
import type { SseEvent } from './types'

const MAX_EVENTS = 20;

export function useEvents() {
    const [connected, setConnected] = useState(false)
    const [events, setEvents] = useState<SseEvent[]>([])
    const [counts, setCounts] = useState({ completed: 0, rejected: 0 })

    // Acumula fora do React; a tela só é atualizada a cada 200ms
    const buffer = useRef<SseEvent[]>([])
    const total = useRef({ completed: 0, rejected: 0 })

    useEffect(() => {
        const source = new EventSource('/api/events');

        source.onopen = () => setConnected(true);
        source.onerror = () => setConnected(false);

        source.onmessage = (e) => {
            const event = JSON.parse(e.data) as SseEvent
            buffer.current.push(event);
            if (event.topic === "transfers.completed") total.current.completed++;
            if (event.topic === "transfers.rejected") total.current.rejected++;
        }

        const timer = setInterval(() => {
            if (buffer.current.length === 0) return
            const batch = buffer.current
            buffer.current = []

            setEvents((prev) => [...batch.reverse(), ...prev].slice(0, MAX_EVENTS))
            setCounts({ ...total.current })
        }, 200)

        return () => {
            source.close()
            clearInterval(timer)
        }
    }, [])

    return  { connected, events, counts }
}
import './App.css'
import type { SseEvent } from './types'
import { useEvents } from './useEvents'
import { useTotal } from "./hooks/useTotal"
const EXPECTED = 1_000_000_000 // 10.000 contas × R$ 1.000,00, em centavos
const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function describe(e: SseEvent) {
  if (!e.value) return { id: Math.random().toString(), text: e.topic }
  const t = JSON.parse(e.value)
  return { id: t.transferId as string, text: `${t.from} → ${t.to} | R$ ${(t.amount / 100).toFixed(2)}` }
}

function App() {
  const { connected, events, counts } = useEvents()
  const total = useTotal()

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>KafkaBank</h1>
      <p>{connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
      <p>
        ✅ Aprovadas: <b>{counts.completed}</b> | ❌ Rejeitadas: <b>{counts.rejected}</b>
      </p>

      <h2>Últimos eventos</h2>
      <ul>
        {events.map((e) => {
          const d = describe(e)
          return (
            <li key={d.id}>
              {e.topic === 'transfers.completed' ? '✅' : '❌'} {d.text}
            </li>
          )
        })}
      </ul>

      <p>
        💰 Total nas contas: <b>{total === null ? '...' : brl(total)}</b>{' '}
        {total !== null && (total === EXPECTED ? '✅ íntegro' : '⚠️ DIVERGENTE')}
      </p>

    </main>
  );
}

export default App

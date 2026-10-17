export type ResultTopic = 'transfers.completed' | 'transfers.rejected' | 'accounts.balance'

export type SseEvent = {
  topic: ResultTopic
  key?: string
  value?: string
}
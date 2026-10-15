/** Tópicos que o gateway escuta para repassar à tela */
export type ResultTopic =
  | 'transfers.completed'
  | 'transfers.rejected'
  | 'accounts.balance';

/** O que o SSE envia ao navegador, igual ao que chega do Kafka */
export type SseEvent = {
  topic: ResultTopic;
  key?: string;   // conta (no accounts.balance) ou origem
  value?: string; // JSON em texto, ou o saldo em centavos
};
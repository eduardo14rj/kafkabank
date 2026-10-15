/** Corpo do POST /transfers (valores em centavos) */
export type TransferRequest = {
  from: number;
  to: number;
  amount: number;
};

/** Mensagem que vai para o tópico transfers.requested */
export type Transfer = TransferRequest & {
  transferId: string;
  createdAt: string; // data em formato ISO
};

/** Mensagem que vai para o tópico transfers.rejected */
export type RejectedTransfer = Transfer & {
  motivo: 'saldo_insuficiente';
};
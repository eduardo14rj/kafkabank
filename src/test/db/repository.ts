import { db } from "./db.js";
import type { Transfer } from "../../types/transfer.js";

export type TransferResult = "completed" | "rejected" | "duplicate";

// Statements preparados uma vez só (mais rápido que preparar a cada mensagem)
const selectBalance = db.prepare("SELECT balance FROM accounts WHERE id = ?");
const selectProcessed = db.prepare("SELECT 1 FROM processed_transfers WHERE transfer_id = ?");
const insertProcessed = db.prepare(
    "INSERT INTO processed_transfers (transfer_id, status, processed_at) VALUES (?, ?, ?)"
);

const addToBalance = db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?");
const selectTotal = db.prepare("SELECT SUM(balance) AS total FROM accounts");

export function getBalance(accountId: number): number | undefined {
    const row = selectBalance.get(accountId) as { balance: number } | undefined;
    return row?.balance;
}

export function getTotalBalance(): number {
    return (selectTotal.get() as { total: number }).total;
}

function markProcessed(transferId: string, status: TransferResult) {
    insertProcessed.run(transferId, status, new Date().toISOString());
}

// Tudo dentro de UMA transação: ou grava tudo, ou nada.
export const processTransfer = db.transaction((t: Transfer): TransferResult => {
    // 1. Já processada? (mensagem repetida pelo at-least-once)
    if (selectProcessed.get(t.transferId)) return "duplicate";

    // 2. Saldo suficiente?
    const balance = getBalance(t.from);
    if (balance === undefined) throw new Error(`Conta origem ${t.from} não existe`);
    if (balance < t.amount) {
        markProcessed(t.transferId, "rejected");
        return "rejected";
    }

    // 3. Debita e credita
    addToBalance.run(-t.amount, t.from);
    const credit = addToBalance.run(t.amount, t.to);
    if (credit.changes === 0) throw new Error(`Conta destino ${t.to} não existe`); // desfaz tudo

    markProcessed(t.transferId, "completed");
    return "completed";
});
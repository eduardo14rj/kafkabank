import { randomUUID } from "node:crypto";
import { newProducer } from "../kafka.js";
import { getBalance, getTotalBalance } from "./db/repository.js";
import type { Transfer } from "../types/transfer.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const transfer: Transfer = {
    transferId: randomUUID(),
    from: 1,
    to: 2,
    amount: 10_000, // R$ 100,00
    createdAt: new Date().toISOString(),
};

const before = { c1: getBalance(1), c2: getBalance(2), total: getTotalBalance() };

const producer = newProducer();
await producer.connect();

const message = { key: String(transfer.from), value: JSON.stringify(transfer) };
// Mesma mensagem, mesmo transferId, enviada 2 vezes
await producer.send({ topic: "transfers.requested", messages: [message, message] });
await producer.disconnect();

console.log("Enviada 2x:", transfer.transferId);
await sleep(3000); // tempo para o processor ler

console.log("Conta 1:", before.c1, "→", getBalance(1));
console.log("Conta 2:", before.c2, "→", getBalance(2));
console.log("Total  :", before.total, "→", getTotalBalance());
process.exit(0);
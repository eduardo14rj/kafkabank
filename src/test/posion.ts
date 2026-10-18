import { randomUUID } from "node:crypto";
import { newProducer } from "../kafka.js";
import type { Transfer } from "../types/transfer.js";

const tipo = process.argv[2] ?? "conta"; // "conta" ou "json"

const transfer: Transfer = {
    transferId: randomUUID(),
    from: 1,
    to: 9_999_999, // conta que não existe
    amount: 100,
    createdAt: new Date().toISOString(),
};

const value = tipo === "json" ? "isto-nao-e-json" : JSON.stringify(transfer);

const producer = newProducer();
await producer.connect();
await producer.send({ topic: "transfers.requested", messages: [{ key: "1", value }] });
await producer.disconnect();

console.log(`Mensagem venenosa enviada (${tipo})`);
process.exit(0);
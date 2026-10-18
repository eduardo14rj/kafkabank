import { kafka, newProducer } from "./kafka.js";
import { processTransfer, TransferResult } from "./test/db/repository.js";
import type { RejectedTransfer, Transfer } from "./types/transfer.js";

const CONSUMERS = 3
const MAX_ATTEMPTS = 5

const producer = newProducer();
await producer.connect();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const stats = { completed: 0, rejected: 0, duplicate: 0, dlq: 0 };

async function publishResult(transfer: Transfer, result: TransferResult) {
    if (result === "duplicate") return; // não publica duplicatas
    if (result === "completed") {
        await producer.send({
            topic: "transfers.completed",
            messages: [
                {
                    key: String(transfer.from),
                    value: JSON.stringify(transfer)
                }
            ]
        })
        return;
    }
    const rejected: RejectedTransfer = { ...transfer, motivo: "saldo_insuficiente" };
    await producer.send({
        topic: "transfers.rejected",
        messages: [
            {
                key: String(transfer.from),
                value: JSON.stringify(rejected)
            }
        ]
    })
}

// Mensagem que esgotou as tentativas: vai intacta para o DLQ, com o motivo nos headers
async function sendToDlq(value: string, partition: number, offset: string, error: unknown) {
    const motivo = error instanceof Error ? error.message : String(error);
    await producer.send({
        topic: "transfers.dlq",
        messages: [
            {
                value,
                headers: {
                    erro: motivo,
                    origem: `transfers.requested/P${partition}/#${offset}`,
                    tentativas: String(MAX_ATTEMPTS)
                }
            }
        ]
    })
}

async function startConsumer(name: string) {
    const consumer = kafka.consumer({
        kafkaJS: {
            groupId: "transfer-processor",
            fromBeginning: true,
            autoCommitInterval: 2000
        }
    });

    await consumer.connect();
    await consumer.subscribe({ topics: ["transfers.requested"] });

    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            if (!message.value) return;
            const value = message.value.toString();

            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    const transfer = JSON.parse(value) as Transfer;
                    const result = processTransfer.immediate(transfer);
                    stats[result]++;
                    await publishResult(transfer, result);
                    console.log(`[${name}] P${partition} #${message.offset} | ${transfer.from} → ${transfer.to} | ${transfer.amount} | ${result}`);
                    const total = stats.completed + stats.rejected + stats.duplicate;
                    if (total % 1000 === 0) {
                        console.log("Resumo:", stats);
                    }
                    await sleep(10); // simula processamento
                    return;
                } catch (error) {
                    console.warn(`[${name}] P${partition} #${message.offset} | tentativa ${attempt}/${MAX_ATTEMPTS} falhou`);
                    if (attempt < MAX_ATTEMPTS) {
                        await sleep(200 * attempt);
                        continue;
                    }

                    await sendToDlq(value, partition, message.offset, error);
                    stats.dlq++;
                    console.error(`[${name}] P${partition} #${message.offset} | enviada ao DLQ`);
                }
            }
        }
    });

    console.log(`Consumer ${name} aguardando mensagens...`);
}

for (let i = 1; i <= CONSUMERS; i++) {
    await startConsumer(`C${i}`);
}

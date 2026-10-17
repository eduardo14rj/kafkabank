import { kafka, newProducer } from "./kafka.js";
import { processTransfer, TransferResult } from "./test/db/repository.js";
import type { RejectedTransfer, Transfer } from "./types/transfer.js";

const CONSUMERS = 3

const producer = newProducer();
await producer.connect();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const stats = { completed: 0, rejected: 0, duplicate: 0 };

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

async function startConsumer(name: string) {
    const consumer = kafka.consumer({
        kafkaJS: {
            groupId: "transfer-processor",
            fromBeginning: true
        }
    });

    await consumer.connect();
    await consumer.subscribe({ topics: ["transfers.requested"] });

    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            if (!message.value) return;

            const transfer = JSON.parse(message.value.toString()) as Transfer;
            const result = processTransfer.immediate(transfer);
            stats[result]++;

            await publishResult(transfer, result);

            console.log(`[${name}] P${partition} #${message.offset} | ${transfer.from} → ${transfer.to} | ${transfer.amount} | ${result}`);

            const total = stats.completed + stats.rejected + stats.duplicate;
            if (total % 1000 === 0) {
                console.log("Resumo:", stats);
            }

            await sleep(10); // simula processamento
        }
    });

    console.log(`Consumer ${name} aguardando mensagens...`);
}

for (let i = 1; i <= CONSUMERS; i++) {
    await startConsumer(`C${i}`);
}

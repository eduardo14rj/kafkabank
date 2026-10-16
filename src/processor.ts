import { kafka } from "./kafka.js";
import { processTransfer } from "./test/db/repository.js";
import type { Transfer } from "./types/transfer.js";

const CONSUMERS = 3

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const stats = { completed: 0, rejected: 0, duplicate: 0 };

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

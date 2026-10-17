import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ServerResponse } from 'node:http';
import { kafka, newProducer } from "./kafka.js";
import { eventController } from "./controllers/events.js";
import { transferController } from "./controllers/transfer.js";
import { totalController } from "./controllers/total.js";

const app = Fastify({ logger: { level: 'info' } });
await app.register(cors);

const producer = newProducer();
await producer.connect();

await app.register(eventController);
await app.register(totalController);
await app.register(transferController, { producer });


app.listen({ port: 3001 }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});

const shutdown = async () => {
    console.log('Desconectando...');
    await app.close();
    await producer.disconnect();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
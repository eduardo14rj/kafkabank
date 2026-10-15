import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto"
import type { ServerResponse } from 'node:http';
import { kafka, newProducer } from "./kafka.js";

const app = Fastify();
await app.register(cors);

const producer = newProducer();
// await producer.connect();



app.listen({ port: 3001 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});



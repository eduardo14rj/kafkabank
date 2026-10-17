import type { FastifyPluginAsync } from "fastify";
import type { ServerResponse } from 'node:http';
import { ResultTopic, SseEvent } from "../types/events.js";
import { kafka } from "../kafka.js";

export const eventController: FastifyPluginAsync = async (app) => {
    const clients = new Set<ServerResponse>();

    const broadcast = (event: SseEvent) => {
        const message = `data: ${JSON.stringify(event)}\n\n`;
        for (const client of clients) client.write(message);
    }

    const ping = setInterval(() => {
        for (const client of clients) client.write(": ping\n\n");
    }).unref();

    const consumer = kafka.consumer({
        kafkaJS: {
            groupId: "gateway-sse",
            fromBeginning: false
        }
    });

    await consumer.connect();
    await consumer.subscribe({ topics: ["transfers.completed", "transfers.rejected"] });
    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            broadcast({
                topic: topic as ResultTopic,
                key: message.key?.toString(),
                value: message.value?.toString()
            });
        }
    });


    /** SSE endpoint */
    app.get("/events", async (request, reply) => {
        reply.hijack();

        reply.raw.writeHead(200, {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            "connection": "keep-alive",
            "access-control-allow-origin": "*"
        });
        reply.raw.flushHeaders();
        reply.raw.write(": connected\n\n");

        clients.add(reply.raw);
        app.log.info(`SSE client connected, total: ${clients.size}`);

        reply.raw.on("close", () => {
            clients.delete(reply.raw);
            app.log.info(`SSE client disconnected, total: ${clients.size}`);
        })
    })

    app.addHook("onClose", async () => {
        clearInterval(ping);
        for (const res of clients) res.end();
        clients.clear();
        await consumer.disconnect();
    });

};

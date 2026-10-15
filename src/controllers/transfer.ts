import type { FastifyPluginAsync } from "fastify";
import { Transfer, TransferRequest } from "../types/transfer.js";
import { randomUUID } from "node:crypto"
import { Producer } from "../kafka.js";

export const transferController: FastifyPluginAsync<{ producer: Producer }> = async (app, { producer }) => {

    app.post<{ Body: TransferRequest }>("/transfers", async (request, reply) => {
        const { from, to, amount } = request.body as TransferRequest;

        const transfer: Transfer = {
            from,
            to,
            amount,
            transferId: randomUUID(),
            createdAt: new Date().toISOString()
        };

        await producer.send({
            topic: 'transfers.requested',
            messages: [
                { key: transfer.from.toString(), value: JSON.stringify(transfer) }
            ]
        })

        return reply.status(200).send({
            transferId: transfer.transferId,
            from,
            to,
            amount
        });
    });

}

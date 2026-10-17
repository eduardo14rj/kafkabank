import type { FastifyPluginAsync } from "fastify";
import { getTotalBalance } from "../test/db/repository.js";

export const totalController: FastifyPluginAsync = async (app) => {
    app.get("/total", async () => {
        return { total: getTotalBalance() }; // em centavos
    });
};
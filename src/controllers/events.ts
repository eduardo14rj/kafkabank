import type { FastifyPluginAsync } from "fastify";
import type { ServerResponse } from 'node:http';
import { ResultTopic, SseEvent } from "../types/events.js";
import { kafka } from "../kafka.js";

export const eventController: FastifyPluginAsync = async (app) => {};

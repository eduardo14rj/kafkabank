import { kafka } from "./kafka.js";

const consumer = kafka.consumer({
    kafkaJS: {
        groupId: "transfer-processor",
        fromBeginning: true
    }
})


await consumer.connect();
await consumer.subscribe({ topics: ["transfers.requested"] });

await consumer.run({
    eachMessage: async ({ partition, message }) => {
        console.log(`P${partition} offset ${message.offset} key=${message.key?.toString()}`);
        console.log('Valor da mensagem', message.value?.toString());
    }
});

console.log('Processor aguardando mensagens...');
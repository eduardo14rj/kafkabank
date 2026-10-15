import { KafkaJS } from '@confluentinc/kafka-javascript';

export const kafka = new KafkaJS.Kafka({
    kafkaJS: { clientId: 'kafkabank', brokers: ['localhost:9092'] },
});

export const newProducer = () => kafka.producer();
import { kafka } from "./kafka.js";

const topics = [
  // Pedidos de transferência (gateway e generator escrevem, processor lê)
  { topic: 'transfers.requested', numPartitions: 3, replicationFactor: 1 },

  // Resultados do processamento (processor escreve, gateway lê)
  { topic: 'transfers.completed', numPartitions: 3, replicationFactor: 1 },
  { topic: 'transfers.rejected',  numPartitions: 3, replicationFactor: 1 },

  // Mensagens que falharam mesmo após os retries (processor escreve)
  { topic: 'transfers.dlq', numPartitions: 1, replicationFactor: 1 },

  // Último saldo de cada conta (processor escreve, gateway e auditor leem)
  {
    topic: 'accounts.balance',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'cleanup.policy', value: 'compact' }, // mantém só o último valor por key
    ],
  },
];


const admin = kafka.admin();
await admin.connect();


const existentes = await admin.listTopics();
const novos = topics.filter((t) => !existentes.includes(t.topic));

if (novos.length) {
  await admin.createTopics({ topics: novos });
  console.log('✔ Criados:', novos.map((t) => t.topic).join(', '));
} else {
  console.log('✔ Todos os tópicos já existem');
}

// Mostra o estado final
const final = await admin.listTopics();
console.log('Tópicos no broker:', final.filter((t) => !t.startsWith('__')).sort());

await admin.disconnect();
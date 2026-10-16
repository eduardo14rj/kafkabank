// generator.ts - Gera transferências aleatórias para teste de carga do serviço de transferências
const API = "http://localhost:3001/transfers";
const ACCOUNTS = 10_000;
const TRANSFERS = Number(process.argv[2] ?? 10_000);   // quantas transferências enviar
const CONCURRENCY = Number(process.argv[3] ?? 100);    // quantas em paralelo

// Lista das 10 mil contas: ids de 1 a 10000
const accounts = Array.from({ length: ACCOUNTS }, (_, i) => i + 1);

const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const pickAccount = () => accounts[randomInt(0, accounts.length - 1)];

function randomTransfer() {
    const from = pickAccount();
    let to = pickAccount();
    while (to === from) to = pickAccount();
    // 100 a 120.000 centavos: alguns passam do saldo inicial (100.000) e serão rejeitados
    return { from, to, amount: randomInt(100, 120_000) };
}

let sent = 0;
let ok = 0;
let failed = 0;

async function worker() {
    while (sent < TRANSFERS) {
        sent++;
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(randomTransfer()),
            });
            res.ok ? ok++ : failed++;
        } catch {
            failed++;
        }
    }
}

console.log(`Enviando ${TRANSFERS} transferências, ${CONCURRENCY} em paralelo...`);
const start = Date.now();

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const seconds = (Date.now() - start) / 1000;
console.log(`Concluído em ${seconds.toFixed(1)}s (${Math.round(TRANSFERS / seconds)} req/s)`);
console.log(`OK: ${ok} | Falhas: ${failed}`);
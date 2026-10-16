import { randomUUID } from "node:crypto";
import { processTransfer, getBalance, getTotalBalance } from "./repository.js";

const t = { transferId: randomUUID(), from: 1, to: 2, amount: 5000, createdAt: new Date().toISOString() };

console.log(processTransfer(t));   // completed
console.log(processTransfer(t));   // duplicate (mesma transferência de novo)
console.log("saldos:", getBalance(1), getBalance(2));
console.log("total:", getTotalBalance());
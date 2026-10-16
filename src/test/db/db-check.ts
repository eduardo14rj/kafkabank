import { db } from "./db.js"

const n = db.prepare("SELECT COUNT(*) AS contas, SUM(balance) AS total FROM accounts").get()

console.log(n);
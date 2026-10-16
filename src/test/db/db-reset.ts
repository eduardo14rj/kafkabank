import { db, INITIAL_BALANCE } from "./db.js";

db.transaction(() => {
    db.prepare("UPDATE accounts SET balance = ?").run(INITIAL_BALANCE);
    db.prepare("DELETE FROM processed_transfers").run();
})();

console.log(db.prepare("SELECT COUNT(*) AS contas, SUM(balance) AS total FROM accounts").get());
import Database from "better-sqlite3";

export const INITIAL_BALANCE = 100_000;
export const TOTAL_ACCOUNTS = 10_000;

export const db = new Database("kafkabank.db");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY,
    balance INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS processed_transfers (
    transfer_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    processed_at TEXT NOT NULL
  );
    `);


const { n } = db.prepare("SELECT COUNT(*) AS n FROM accounts").get() as { n: number };

if (n === 0) {
    const insert = db.prepare("INSERT INTO accounts (id, balance) VALUES (?, ?)");
    db.transaction(() => {
        for (let i = 1; i <= TOTAL_ACCOUNTS; i++) {
            insert.run(i, INITIAL_BALANCE);
        }
    })();
}
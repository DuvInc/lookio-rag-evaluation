import { readFileSync } from "node:fs";
import { summarize } from "../lib/score.mjs";

const load = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8").trim().split("\n").map(JSON.parse);
const results = summarize(load("data/questions.jsonl"), load("data/attempts.jsonl"));
console.log("Dataset       System         Fully correct    Success within two attempts");
for (const row of results) console.log(`${row.dataset.padEnd(13)} ${row.system.padEnd(14)} ${String(row.fully_correct).padStart(3)}/${row.questions}          ${row.accuracy_within_two_attempts_pct.toFixed(1)}%`);

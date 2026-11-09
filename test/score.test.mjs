import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { summarize } from "../lib/score.mjs";

const root = new URL("../", import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const lines = path => readFileSync(new URL(path, root), "utf8").trim().split("\n").map(JSON.parse);

test("published strict totals recompute from all candidate answers", () => {
  const questions = lines("data/questions.jsonl");
  const attempts = lines("data/attempts.jsonl");
  const answers = lines("data/answers.jsonl");
  assert.equal(questions.length, 450);
  assert.equal(attempts.length, 1323);
  assert.equal(answers.length, 900);
  const actual = summarize(questions, attempts);
  const sort = rows => [...rows].sort((left, right) => `${left.dataset}:${left.system}`.localeCompare(`${right.dataset}:${right.system}`));
  assert.deepEqual(sort(actual), sort(json("results.json")));
  const rank = { wrong: 0, partial: 1, correct: 2 };
  for (const answer of answers) {
    const candidates = attempts.filter(row => row.id === answer.id && row.system === answer.system).sort((left, right) => left.attempt - right.attempt);
    const selected = candidates.reduce((best, candidate) => rank[candidate.grade] > rank[best.grade] ? candidate : best);
    assert.equal(answer.answer, selected.answer);
    assert.equal(answer.grade, selected.grade);
    assert.equal(answer.selected_attempt, selected.attempt);
    assert.equal(answer.selected_attempt_latency_ms, selected.latency_ms);
    assert.equal(answer.total_attempt_latency_ms, candidates.reduce((total, row) => total + row.latency_ms, 0));
    assert.equal(answer.attempt_count, candidates.length);
  }
});

test("every published data hash matches", () => {
  for (const [path, expected] of Object.entries(json("data/checksums.json"))) assert.equal(createHash("sha256").update(readFileSync(new URL(path, root))).digest("hex"), expected, path);
});

const questions = [{ id: "question", dataset: "fixture" }];
const candidate = (system, grade, attempt = 1) => ({ id: "question", dataset: "fixture", system, grade, attempt, answer: `${grade}-${attempt}`, latency_ms: 10 });

test("partial answers earn zero and a correct extra attempt earns one", () => {
  const results = summarize(questions, [candidate("classic-rag", "partial"), candidate("lookio-v2", "wrong"), candidate("lookio-v2", "correct", 2)]);
  assert.equal(results.find(row => row.system === "classic-rag").fully_correct, 0);
  assert.equal(results.find(row => row.system === "lookio-v2").fully_correct, 1);
});

test("missing, duplicate and third attempts are refused", () => {
  const base = [candidate("classic-rag", "partial"), candidate("lookio-v2", "wrong")];
  assert.throws(() => summarize(questions, base.slice(0, 1)), /Missing/);
  assert.throws(() => summarize(questions, [...base, base[0]]), /duplicate/);
  assert.throws(() => summarize(questions, [...base, candidate("classic-rag", "correct", 3)]), /Invalid/);
});

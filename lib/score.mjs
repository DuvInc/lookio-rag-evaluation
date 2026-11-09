export const SYSTEMS = ["classic-rag", "lookio-v2"];

export function summarize(questions, attempts) {
  const known = new Map(questions.map(question => [question.id, question]));
  if (known.size !== questions.length) throw new Error("Duplicate question IDs");
  const grouped = new Map();
  for (const attempt of attempts) {
    const question = known.get(attempt.id);
    if (!question || question.dataset !== attempt.dataset || !SYSTEMS.includes(attempt.system)) throw new Error("Unknown question, dataset or system");
    if (!["correct", "partial", "wrong"].includes(attempt.grade) || ![1, 2].includes(attempt.attempt)) throw new Error("Invalid grade or attempt number");
    if (typeof attempt.answer !== "string" || !Number.isFinite(attempt.latency_ms) || attempt.latency_ms < 0) throw new Error("Invalid answer or latency");
    const key = `${attempt.system}:${attempt.id}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(attempt);
  }
  const selected = [];
  for (const system of SYSTEMS) {
    for (const question of questions) {
      const candidates = (grouped.get(`${system}:${question.id}`) ?? []).sort((left, right) => left.attempt - right.attempt);
      if (!candidates.length || candidates.length > 2 || candidates[0].attempt !== 1 || (candidates[1] && candidates[1].attempt !== 2)) throw new Error("Missing or duplicate attempts");
      if (candidates[1] && candidates[0].grade === "correct") throw new Error("Unnecessary additional attempt");
      if (candidates[1] && candidates[0].answer === candidates[1].answer && candidates[0].grade !== candidates[1].grade) throw new Error("Identical answers have inconsistent grades");
      selected.push({ system, dataset: question.dataset, correct: candidates.some(candidate => candidate.grade === "correct") });
    }
  }
  return [...new Set(questions.map(question => question.dataset)), "all"].flatMap(dataset => SYSTEMS.map(system => {
    const group = selected.filter(row => row.system === system && (dataset === "all" || row.dataset === dataset));
    const correct = group.filter(row => row.correct).length;
    return { dataset, system, questions: group.length, fully_correct: correct, accuracy_within_two_attempts_pct: Number((100 * correct / group.length).toFixed(4)) };
  }));
}

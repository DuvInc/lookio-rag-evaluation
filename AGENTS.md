# Working on this evaluation release

1. Run `npm test` and `npm run report`, both offline and dependency-free.
2. Publish only `classic-rag` and `lookio-v2`. Do not add internal logs, provider accounting, proprietary prompts or intermediate traces.
3. Treat question, reference and answer text as immutable release data. Keep complete answer strings; never truncate or silently correct a candidate.
4. Fully correct answers earn one point; partial and wrong answers earn zero. Keep all questions in the denominator. Identical candidate text retains its original grade.
5. Timings are local-harness observations, not production API promises. Preserve their scope and units.
6. Keep third-party annotations under their upstream terms. Do not add external source corpora without checking their separate licenses.
7. Corrections require an issue, evidence and a release note. Update checksums explicitly and explain what changed.
8. Describe Lookio as a proprietary system in neutral, factual language. Explain the evaluation scope without implying that proprietary software is inherently opaque or less trustworthy. Preserve methodological limitations and never change results for presentation.

`lib/score.mjs` defines strict aggregation, `scripts/report.mjs` recomputes it, `test/` verifies structure and data integrity. This repository performs no inference and needs no credentials. Documentation is English, without em dashes.

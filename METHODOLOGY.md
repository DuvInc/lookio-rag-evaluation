# Methodology

## Questions and corpora

450 exact questions are frozen in `data/questions.jsonl`, 150 each from Arvenne RAG Bench, DataBench and HybridQA. Every selected question's supporting documents are available in the bounded evaluation corpora. Arvenne uses all 25 released documents. DataBench and HybridQA use document subsets with other documents included; this is not retrieval over their full original corpora. The baseline's exact document titles, extraction lengths and hashes are in `baseline/corpus-manifest.json`.

DataBench questions identify their source table by an added name prefix. References and question text are published exactly as used. HybridQA questions are drawn from the 305-question dev sample distributed with TableRAG; the downloaded sample matches official HybridQA dev questions and answers by upstream question ID. The evaluated 150 upstream IDs are published. A filter required HybridQA references to occur in their supporting documents. This filter makes the subset different from an unfiltered official evaluation.

Arvenne is a synthetic dataset created by Lookio's developer. Its questions and references were frozen before running systems against it. The dataset is independently downloadable but not independently authored; per-dataset results are therefore essential to interpreting the aggregate.

## System definitions

Classic RAG is specified in `baseline/README.md` and `baseline/config.json`. Lookio V2 is Lookio's proprietary document question-answering system, evaluated in its Deep configuration using a local harness. This release documents the evaluation protocol for both systems and the implementation details of the classic pipeline.

All answer-generation chat calls in the two systems use `anthropic/claude-haiku-5.5`, with `reasoning.effort=none`. The judge uses the same model and reasoning setting. This identifies the language model used for this evaluation, not a promise about production default models. Preprocessing and system capabilities differ; internal call counts are not equalized. The comparison is end-to-end, and cannot isolate the cause of a gain to retrieval alone.

## Attempts and scoring

A question has up to two full-pipeline attempts per system. Only answers not graded fully correct, including partial answers, receive a second attempt. A fresh attempt receives the original question and system configuration, never the previous candidate, grade, reference or corrective feedback. There are no third semantic attempts. Existing within-pipeline transport/format retries are distinct from a new end-to-end attempt.

Success is evaluated offline against the reference: at least one fully correct candidate makes the question correct. This is observed success within two attempts, or oracle pass@2, not single-attempt accuracy and not autonomous candidate selection. Partial and wrong candidates both score zero. All 450 questions remain in each system's denominator. The selected full answer is the strongest graded candidate; ties retain the earlier candidate. For a non-success, selecting a partial over a wrong answer does not award points.

Byte-identical candidate text retains its original grade rather than acquiring a second chance at a favorable stochastic judgment. This consistency check was applied during the final audit. The strict success totals were unaffected by inconsistent duplicate partial/wrong grades. All published candidate grades reflect this rule.

The judge is shown the question, reference, accepted aliases, available rubric, answer type and candidate, but not system identity or retrieved documents. `grading/judge-prompt.txt` contains the exact template; `grading/config.json` gives its settings. The benchmark's numeric code checks are diagnostic only, not an alternative way to earn credit. There was no independent human adjudication of every answer. Judge errors and shared model-family bias remain limitations.

## Timing fields

- `data/attempts.jsonl`: `latency_ms` is that candidate's answer-generation wall time in the local harness.
- `data/answers.jsonl`: `selected_attempt_latency_ms` belongs to the selected candidate; it is not a fastest-of-two selection.
- `total_attempt_latency_ms` sums the answer-generation time of the attempts actually executed for that system/question. It excludes the judge that decided whether a retry was needed.

Indexing, document preparation and judging are excluded. Provider/network variability, process concurrency and separate generation sessions affect the observations. They do not measure production API request latency, tail reliability or a complete two-attempt production workflow. No speed claim is made from these timings.

## Released evaluation materials

This release contains all evaluated question/reference pairs, all candidate answer texts, candidate grades, timings and aggregate strict results for the two named systems. It also includes the exact classic baseline configuration and the grading template, so readers can inspect the evaluation and independently recompute its scores. Lookio's implementation remains proprietary.

The two-attempt policy was chosen after an initial evaluation, then the extra-attempt eligibility and settings were frozen before generating new candidates. Dataset inclusion and the broader configuration followed exploratory work. This is a descriptive, vendor-authored comparison on the released set, not a preregistered or independent confirmatory test. No claim is made about all RAG systems or unseen production workloads.

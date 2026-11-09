# Classic RAG configuration

This release defines a plain text-only dense retrieval baseline, rather than treating "classic RAG" as a universal architecture. The goal is an understandable reference implementation. It is not a tuned state-of-the-art baseline.

## Extraction

For Arvenne's files, PDF text is extracted with `pdftotext -layout`; Word contributes paragraph text; PowerPoint contributes text from shapes with text frames; Excel contributes each sheet name and its rows as comma-separated lines. HTML has script/style blocks and tags removed, then entities decoded. Text, Markdown, CSV and JSON are read as plain text. Images have no text extraction and scans with no text layer contribute no useful text. There is no OCR or image model. Embedded images and charts are not interpreted.

DataBench and HybridQA use the benchmark's prepared text documents. The exact document manifest includes IDs, names and SHA-256 hashes of the extracted text. External dataset corpora are not redistributed here; get the original sources through `data/sources.json`. The manifest fixes the evaluated subset but does not itself provide a complete re-indexing pipeline for external sources.

## Indexing

The JavaScript `RecursiveCharacterTextSplitter` from `@langchain/textsplitters` splits text into chunks of up to 500 characters, with a requested overlap of 50 characters and the splitter's default separators. The overlap is not guaranteed to be exactly 50 at every boundary. Each chunk is prefixed with `Source: {source_title}\n` after splitting, so the prefixed input can exceed 500 characters.

Each prefixed chunk gets one `openai/text-embedding-3-small` embedding. Retrieval uses cosine similarity in a local Qdrant index. No sparse/hybrid search, reranking or query decomposition is applied.

## Answering

1. Embed the original question, unchanged, with the same embedding model.
2. Retrieve the ten highest-scoring chunks from that question's dataset corpus.
3. Build context as numbered excerpts: `[1] {source_title}\n{prefixed_chunk_text}`, separated by blank lines.
4. Make one `anthropic/claude-haiku-5.5` answer call, reasoning disabled, with a 2,000-token output ceiling. Temperature is not explicitly set.

The exact system and user prompt templates are in `config.json`. The prompt tells the reader to answer only from the provided context, say when it does not know, answer concisely in English and keep numbers exact. The baseline has no SQL or full-table computation tool.

The absence of OCR and table-execution capabilities matters for scans, diagrams and aggregate questions. This is a comparison of the complete systems as configured, not proof that retrieval alone explains the score difference or that stronger open-source pipelines would perform the same way.

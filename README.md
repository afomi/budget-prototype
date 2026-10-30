# Budget documents as pull requests

Lean Jekyll prototype, a sourced three-row Vacaville budget excerpt, and a real GitHub document-review workflow. No backend, database, wallet, or JavaScript packages.

**Merging a PR means approval of that document version.**

## The sample

Source: Vacaville FY2025–26 Final Budget Document, Lighting & Landscaping Districts, printed p.123 / PDF p.175, FY 2025/26 Proposed Budget column.

| Item | Source amount | Hypothetical request |
| --- | ---: | ---: |
| Alamo Creek Park | $246,279 | $246,279 |
| Nelson Park | $162,778 | $162,778 |
| Patwin Park | $150,575 | $155,575 |
| **Excerpt total** | **$559,632** | **$564,632** |

The extra $5,000 is an invented review exercise; the source amounts are real. This is not the full parks budget. [Provenance and extracted source page](sources/vacaville-fy2025-26.md).

## Branch convention

| Branch | Meaning |
| --- | --- |
| budget/fy2025-26/approved | Approved FY 2025–26 document version |
| budget/fy2025-26/working | Proposed revisions for that fiscal year |
| budget/fy2026-27/working | Example name for next year's work; create when needed |
| main | Prototype code and workflow |

Use lowercase names and fyYYYY-YY, with the starting year in full. Use the actual fiscal year rather than relative labels such as "next-year". Use draft PRs for work in progress. Git tracks document versions; the PR records approval, so budget JSON has no mutable review-status field.

## GitHub flow

1. Edit budgets/fy2025-26/vacaville-parks.json on the working branch.
2. Run the formatter and commit the document.
3. Open a PR from budget/fy2025-26/working into budget/fy2025-26/approved.
4. Review the actual JSON lines in GitHub. Discuss amounts, scope, and funding.
5. The Budget document Action validates JSON, runs checks, and writes a change summary in the Actions run.
6. Resolve review threads and merge when the document is approved.
7. A push to the approved branch creates an Actions artifact with file SHA-256 digests and the commit SHA.

The sample PR is intentionally left open for review. The initial approved branch seeds the transcribed source; its creation is not a historical PR approval. The evidence artifact identifies its commit and branch but does not itself prove review occurred. Review requirements are a human convention in this lean prototype; repository protection rules are not configured.

For concurrent requests, use a short-lived change/fy2025-26/topic branch from approved and target the same approved branch. After merging, update the persistent working branch from approved before another request. Use a separate branch pair for a new fiscal year.

## Local preview

    bundle install
    bundle exec jekyll serve --host 127.0.0.1 --port 4173

Open http://127.0.0.1:4173. The page is an in-memory sandbox using examples/base-budget.json and examples/vacaville-parks-request.json, embedded in generated sample-budget.js. Browser reviews do not write to GitHub. Use the real GitHub PR for persistent discussion and approval.

## Deterministic JSON

The schema in review.js uses fixed field order, stable ASCII item IDs sorted by ID, integer cents, NFC strings, two-space indentation, UTF-8, LF, and a final LF. Totals are derived. Unknown fields are rejected. fiscal_year: 2026 represents the year ending in 2026; the branch and source identify FY2025–26.

    npm run format:budgets
    npm run validate:budgets
    npm test
    npm run check
    bundle exec jekyll build

    npm run budget:summary -- <base-commit>
    npm run budget:evidence

The evidence command works on an approved budget branch and refuses documents that differ from the referenced commit. Generated artifacts are ignored by Git.

## Later blockchain use

Start with an approved-document digest linked to the PR, commit, and signed approval evidence. Keep drafts, comments, and detailed records in Git or their authoritative systems. No blockchain transaction is implemented.

A UTXO model for allocations and obligations can be explored separately once document review works. Native coins/fees and budget dollars remain distinct. Blockchain does not establish source-document truth or independently verify a payment.

## Diagrams

The two SVGs in diagrams reconstruct the supplied federal screenshots. They are federal reference diagrams, not Vacaville's municipal process. Source corrections are noted in each SVG. Regenerate with npm run diagrams.

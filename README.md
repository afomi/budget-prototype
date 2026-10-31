# An annotated city-budget case

The primary view is a digitally native document following **VAC-2026-PATWIN-001**, a fictional $10,000 Patwin Park maintenance work package. It links the original budget page, department/district/fund classification, reviewable request, actual GitHub status, actor-based BPMN, and a signed local execution replay. Narrative and typography lead; interactive evidence is available where it explains a decision.

- `/`: the annotated case, from source budget line to payment and evidence.
- `/budget-request/`: the same proposed components and Markdown justification, with the actual source page.
- `/process/`: the city case in BPMN, with transaction and saved-replay layers.
- `/storyboard/`: the companion textual walkthrough.
- `/reference/federal/` and `/reference/federal-process/`: the earlier federal reference examples.

The public source is a district-level functional distribution, not our invented component breakdown. Public Works / Lighting & Landscaping / Patwin NP / budget fund 2101 is the business classification. Stable JSON IDs are review keys, not official expenditure account codes. The linked staff report and Engineer’s Report give a public example of the original decision packet.

## Real review, simulated execution

The request PR contains only its JSON and Markdown. `.github/case-review-policy.json` names allowed independent approvers and merge actors. `node scripts/github-case.js sync <PR-number> --write` reads GitHub, checks the trusted base-commit policy, current-head independent reviews, scope, merger, and exact reviewed/merged bytes. A verified merge produces a file-hash manifest. An unreviewed merge does not produce a verified approval. See [review instructions](docs/city-review.md).

The site displays a timestamped snapshot; no API token is embedded. Refresh and commit the snapshot after GitHub review changes. Local replay controls never change GitHub status. No collaborator is invited until the user supplies a username.

The replay uses exact cents and demo keys: $10,000 → $2,500 → $1,000 → $750 → $500. It preserves an approved $500 release adjustment and flags an excessive $2,000 commitment. Public evidence can be saved locally for cross-page inspection; private keys are not persisted. A restored replay is read-only until the user starts a fresh session. Source records and evidence export separately.

A GitHub merge approves a prototype document version, not actual City spending. All work-package execution is fictional. The $330M figure is user-supplied context. The [offline UTXO plan](cases/vacaville-fy2025-26/utxo-plan.json) keeps exact cents in signed metadata and native carrier values separate; it has no wallet keys, real inputs, transaction bytes, fees, or broadcasts.

## Run and validate

    npm ci
    bundle install
    npm run city:bpmn
    npm run check
    npm test
    npm run build
    bundle exec jekyll serve --host 127.0.0.1 --port 4090

Restart Jekyll after `_plugins` changes. Dependency assets are registered as static files so watch rebuilds retain them. Browser code uses plain JavaScript; Tailwind and bpmn-js are pinned local dependencies.

## Earlier reference mechanics

# Budget lifecycle, fiscal-year instances, and supporting documents

Lean Jekyll prototype of a hypothetical $10 funding lifecycle, a sourced Vacaville document example, and GitHub PR approval. No backend, database, or wallet. Tailwind is a build dependency; browser behavior uses plain JavaScript.

**Merging a PR means approval of that document version.**

## The focused $10 demonstration

The primary view is process-oriented:
- [_data/lifecycle.json](_data/lifecycle.json) defines the reusable request-to-closeout lifecycle for an appropriation: activities, owners, examples, and cross-cutting feedback.
- [_data/budget_cycles.json](_data/budget_cycles.json) shows concurrent work in an illustrative April 2028 snapshot: prior budgets, current-year execution (FY 2028), the next proposal (FY 2029), and following-year formulation (FY 2030).
- [_data/fy2028.json](_data/fy2028.json) retains a drill-down history for one budget across its lifecycle.
- [_data/execution_example.json](_data/execution_example.json) supplies the hypothetical $10 execution records and maps event kinds to lifecycle activities.

The primary operating view manages multiple budget cycles in parallel. A fiscal-year budget includes preparation before its year and execution and closeout afterward. Git budget versions and PR approvals are supporting document mechanics. These ordered JSON files are embedded by Jekyll without a backend or fetch request.

Each of the nine lifecycle cards opens a concise bridge-repair example in one shared inline panel. The examples include a simple packet, memo, document, screen, or allotment decision tree. Readable draft excerpts and downloadable Markdown samples live in examples/lifecycle/; the first packet also has a CSV estimate and briefing outline. These are illustrative artifacts, not official forms or actual agency records. The previews distinguish a proposed request from enacted authority. Stage 2 reimagines passback as a PR review: OMB direction, agency revision or appeal, and approval plus merge as settlement. The memo is a review-summary export. The review is a compact illustrated sequence linked to actual sample files; it does not write to GitHub or a blockchain.

Open `/process/` for a single BPMN 2.0 canvas: the connected request-to-closeout lifecycle, a passback loop, an optional adjustment, monitoring, and experiment setup. Toggle proposed transaction highlighting, select T0–T7/TA, zoom/pan, and export the current SVG. Actor lanes show the agency budget office, OMB, Executive, Congress, funds control, contracting, engineering, finance/Treasury, and audit. Horizontal text annotations label the phases along a wide left-to-right sequence. Activity labels repeat responsibility so it remains visible while panning. The viewer starts at reading scale; Start returns to the beginning and Fit all shows the full canvas. The editable [BPMN file](diagrams/budget-lifecycle.bpmn) includes DI layout, transaction colors, and task documentation for import into Touchpoints. [budget-path-story.json](diagrams/budget-path-story.json) is a contiguous path-story API payload; transaction highlighting is a separate set of nodes across the canvas. No Touchpoints account writes are performed.

Regenerate the BPMN and transaction mapping with `npm run bpmn`. Jekyll embeds the XML and registers the pinned local bpmn-js viewer assets as static files, preserving them across watch rebuilds; no CDN or application backend is required. The model is descriptive, not an executable government workflow.

The worked execution example uses one hypothetical appropriation: $10 → $2.50 apportionment → $1 allotment → $0.75 obligation → $0.50 payment. These are nested limits and cumulative records, not amounts to sum.

- Traceability: select the obligation or payment and follow parent references to the appropriation.
- Authorization: source signatures are checked against a local allowlist; a separate approval signature binds the exact document digest.
- Change management: append AP-002 to revise the apportionment from $2.50 to $3.00 while preserving AP-001 and its original receipt.
- Continuous monitoring: submit a $2 obligation against the remaining $0.25 allotment, an unauthorized source, a missing approval, or a record changed after signing. Each is flagged without changing accepted authority.

The financial records live in a simulated source-record store. The verification log contains hashes, signer references/signatures, lineage, and prior-receipt links. It omits budget amounts. The two stores export separately.

This is a simulated permissioned ledger, not a blockchain network. Signatures and SHA-256 digests are computed with Web Crypto using session-only demo keys. Financial systems, institutional identities, and document approval are simulated. The local approval signer stands in for a reviewed/merged document; it does not assert that a GitHub merge occurred. No money moves. A real deployment needs a trusted key registry and network adapter.

Run the independent verifier on the two exported files:

    node scripts/verify-flow.js verification-evidence.json source-records.json

It uses only public keys, source records, and evidence. It verifies relative to the supplied demo registry; it does not authenticate that registry against a real institution.

The Vacaville example remains at `/document-review/` and in the real sample GitHub PR. The $10 flow does not use real financial records.

## The Vacaville document sample

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

## Standalone budget request

Open `/budget-request/` for a printable, human-readable request generated from budgets/fy2027-28/bridge-request.json and its Markdown justification. Edit those two files, validate the JSON, and build Jekyll. The same files are usable in a real GitHub PR; no backend is required. The passback preview uses the same line-item justification. Read `/storyboard/` for nine connected paragraphs linking the request, review, and execution artifacts. The source storyboard.md is readable on GitHub too.

## GitHub flow

1. Edit budgets/fy2025-26/vacaville-parks.json on the working branch.
2. Run the formatter and commit the document.
3. Open a PR from budget/fy2025-26/working into budget/fy2025-26/approved.
4. Review the actual JSON lines in GitHub. Discuss amounts, scope, and funding.
5. The Budget document Action validates JSON, runs checks, and writes a change summary in the Actions run.
6. Resolve review threads and merge when the document is approved.
7. A push to the approved branch creates an Actions artifact with budget JSON SHA-256 digests and the commit SHA.

The sample PR is intentionally left open for review. The initial approved branch seeds the transcribed source; its creation is not a historical PR approval. The evidence artifact identifies its commit and branch but does not itself prove review occurred. Review requirements are a human convention in this lean prototype; repository protection rules are not configured.

For concurrent requests, use a short-lived change/fy2025-26/topic branch from approved and target the same approved branch. After merging, update the persistent working branch from approved before another request. Use a separate branch pair for a new fiscal year.

## Local preview

    npm ci
    bundle install
    bundle exec jekyll serve --host 127.0.0.1 --port 4173

Restart the Jekyll preview after adding or changing `_plugins` files; the watcher does not reload plugins.

Open http://127.0.0.1:4173. The document-review page is an in-memory sandbox using examples/base-budget.json and examples/vacaville-parks-request.json, embedded in generated sample-budget.js. Browser reviews do not write to GitHub. Use the real GitHub PR for persistent discussion and approval.

## Jekyll + Tailwind

The build follows [afomi/jekyll-with-tailwind](https://github.com/afomi/jekyll-with-tailwind): CSS theme tokens and a Jekyll post-write hook compile a single stylesheet. The CLI is installed locally and pinned in the lockfile; a missing compiler fails the build instead of fetching tools implicitly. No S3 hosting configuration is included.

Tailwind 4 utilities style the overlapping-cycle and narrative sections. The existing dense styles are imported into the components layer. Preflight is omitted to preserve their spacing and browser defaults. Both page layouts load assets/css/main.css, generated automatically by Jekyll.

    npm run build:css
    npm run build

Three hypothetical narrative variants live in [_data/narratives.json](_data/narratives.json). Each uses $10 million → $2.5 million → $1 million → $750,000 → $500,000; the interactive $10 example has identical proportions.

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

See the [transaction outline for a 330,000-sat / $330 million experiment](docs/blockchain-transaction-outline.md): selected UTXO transitions, exact remainders, fees, and the steps that stay in Git.

Start with a working review process in Git. Use an approved-document digest linked to its review, commit, and approval evidence when independent verification adds value. Draft review activity does not need blockchain transactions. Agency-local controls may be served by a signed log; shared execution handoffs are candidates for a common verification layer. Keep drafts, comments, and detailed records in Git or their authoritative systems. No blockchain transaction is implemented.

A UTXO model for allocations and obligations can be explored separately once document review works. Native coins/fees and budget dollars remain distinct. Blockchain does not establish source-document truth or independently verify a payment.

## Diagrams

The two SVGs in diagrams reconstruct the supplied federal screenshots. They are federal reference diagrams, not Vacaville's municipal process. Source corrections are noted in each SVG. Regenerate with npm run diagrams.

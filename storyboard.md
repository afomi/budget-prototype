---
layout: storyboard
title: Patwin maintenance, from request to payment
permalink: /storyboard/
---

**VAC-2026-PATWIN-001 · FY 2025–26.** The public Vacaville budget table lists $150,575 for Patwin Park in its FY 2025/26 Proposed Budget column. This story proposes a fictional $10,000 maintenance work package within that baseline. The table is context, not proof of legal spending authority. [Inspect the source and its limits]({{ '/sources/vacaville-fy2025-26.md' | relative_url }}).

## Write one reviewable request

A Public Works requester prepares [ordered JSON]({{ '/examples/city/patwin-request.json' | relative_url }}) for $6,000 of grounds maintenance, $2,500 of irrigation repairs, and $1,500 of inspection and contingency. The [Markdown justification]({{ '/cases/vacaville-fy2025-26/request.md' | relative_url }}) explains scope, funding basis, delivery, and controls. The [request page]({{ '/budget-request/' | relative_url }}) renders those same files. There is no proposed transfer from another maintenance district.

## Review, revise, and approve the document

The same files form a real GitHub PR. A reviewer can question a JSON line or the Markdown funding explanation. The requester commits a response to the same PR; earlier commits remain in history. A configured independent approver must approve the current head commit. Merging approves that document version. It is a prototype review and does not approve actual City spending. The [case page]({{ '/' | relative_url }}) shows the timestamped GitHub status; it never substitutes a local replay for an actual review.

The evidence tool records the PR, reviewed commit, authorized reviewer, merge actor, and exact file hashes. Until those checks pass, the approved-file manifest is absent. [Reviewer instructions](https://github.com/afomi/budget-prototype/blob/main/docs/city-review.md) describe the process.

## Record a work-package limit and period release

The local replay records **A-001**, a simulated $10,000 work-package limit, followed by **AP-001**, a $2,500 period release. These are prototype source records, not City records. Each points to this case; AP-001 points back to A-001. The remaining $7,500 is unreleased in the replay. [Inspect the execution records]({{ '/cases/vacaville-fy2025-26/execution.json' | relative_url }}) and [read their narrative]({{ '/cases/vacaville-fy2025-26/records.md' | relative_url }}).

## Assign a work order and record a commitment

Funds control assigns **AL-001**, a $1,000 work-order limit from AP-001. A procurement officer records **OB-001**, a fictional $750 maintenance commitment against that work order. Another $250 remains uncommitted. The [BPMN canvas]({{ '/process/' | relative_url }}) shows the responsible actors and selected proposed transaction points.

## Accept work and attest a payment

A contract manager accepts the first work milestone. Finance records a fictional $500 payment as **PAY-001**, linked to OB-001. A separate verification receipt binds the source digest, demo signatures, parent reference, and previous receipt. Follow PAY-001 → OB-001 → AL-001 → AP-001 → A-001. Another $250 remains committed but unpaid. Financial source records and verification evidence export separately from the case page.

## Change a decision and detect an inconsistency

An approved local adjustment records **AP-002**, raising the period release from $2,500 to $3,000. It references AP-001 and preserves the original receipt. A new $2,000 commitment against the work order exceeds its remaining $250; the gateway flags it without appending a receipt or changing accepted balances. Both demonstrations use the same case, amounts, and parent IDs.

## Reconcile later and choose what to anchor

A later $250 payment would complete the commitment after final acceptance. It remains pending in the live snapshot. Reconciliation retains the approval and payment trail; paid amounts do not become fresh authority. The $330M / 330,000-sat city-scale experiment is context. This small case needs exact cents in signed metadata because one sat per $1,000 cannot express its payments exactly. [The offline UTXO plan]({{ '/cases/vacaville-fy2025-26/utxo-plan.json' | relative_url }}) shows selected state transitions without constructing or broadcasting a transaction.

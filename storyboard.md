---
layout: storyboard
title: A bridge repair, from request to payment
permalink: /storyboard.html
---

Cedar Creek Bridge carries school buses, residents, and emergency vehicles along a fictional federal road. Flood damage has restricted access. An agency wants to repair it as part of a **$10 million bridge-repair program**. This story follows that request through preparation before FY 2028, execution during the year, and later closeout. All decisions and records below are illustrative.

## 1. Write the request

An agency analyst prepares three line items: $7.5 million for priority repairs, $1.5 million for design and inspection, and $1 million for emergency-access planning. The amounts and stable line-item IDs live in [ordered JSON](budgets/fy2027-28/bridge-request.json); the need, delivery milestones, risks, and decision requested live in a [Markdown justification](budgets/fy2027-28/bridge-request.md). Jekyll turns those same files into a [readable budget request](budget-request.html). A reviewer can read the document or inspect the underlying lines.

**Handoff:** the analyst opens a GitHub PR from `budget/fy2027-28/working` into `budget/fy2027-28/approved`, containing the request and its justification. The current files show the revised request described next; the [initial JSON](examples/lifecycle/02-request-v1.json) preserves the earlier wording.

## 2. Review the request

In this proposed workflow, passback is a PR review. The OMB reviewer keeps the $10 million planning level but comments on `priority-bridge-repairs`: “Replace uniform allowances with condition-based estimates. Explain how the priority list protects school-bus and emergency access.” The agency commits a revision to the same PR, updating the line-item justification and quarterly delivery milestones. The clean JSON diff makes the change easy to review; the amounts stay the same. If the agency disagreed, it could attach an appeal before settlement.

The reviewer approves and merges the revised documents. **Merging approves that document version.** The PR preserves the comments, response, and commits; a [passback review summary](examples/lifecycle/02-passback.md) is a portable account of the decision. This is a fictional review, not an actual OMB approval. The repository’s [real Vacaville sample PR](https://github.com/afomi/budget-prototype/pull/1) demonstrates the GitHub document mechanic and remains open for review.

## 3. Propose the budget

The settled request feeds the President’s budget. A [program excerpt](examples/lifecycle/03-presidents-budget.md) carries the same $10 million purpose and proposed level into the submission to Congress. It is still a proposal. The request and its review explain how that proposal was developed.

## 4. Establish authority

For this story, enacted legislation provides $10 million for the bridge-repair program. The agency records **A-001**, including purpose, amount, availability, and the legal reference. The [fictional appropriation excerpt](examples/lifecycle/04-appropriation.md) represents that source. It is this legal authority that supports execution; merging the planning request did not create it.

## 5. Apportion the authority

OMB approves **AP-001**, a $2.5 million limit for April–June 2028, linked to A-001. The [simplified apportionment schedule](examples/lifecycle/05-apportionment.md) makes the parent authority and current-period limit visible. The rest of the appropriation is not automatically available under this schedule.

## 6. Allot funds to the district

Agency funds control checks the district’s $1 million request against the apportionment, purpose, and approval conditions. If it fits, the agency records **AL-001**, referencing AP-001; otherwise it returns the request for review. The [allotment decision](examples/lifecycle/06-allotment.md) records the reasoning. The overview also shows this as a small decision tree. In this simplified snapshot, $1.5 million remains unallotted.

## 7. Obligate funds for the repair

The district signs a $750,000 contract for Cedar Creek Bridge deck repairs and abutment stabilization. Its financial system records **OB-001** against AL-001 and retains the contract and approvals. The [contract and obligation sample](examples/lifecycle/07-obligation.md) shows the key fields. The district has $250,000 of its allotment left unobligated.

## 8. Accept work and pay

Engineers accept the first milestone and approve the contractor’s invoice. Treasury makes a $500,000 payment; the agency records **PAY-001** against OB-001 and reconciles it. The [invoice and payment sample](examples/lifecycle/08-payment.md) links the accepted work, invoice, obligation, and payment. Another $250,000 remains obligated but unpaid. Following the references leads from payment → obligation → allotment → apportionment → appropriation.

## 9. Reconcile and retain the history

Later, after final acceptance and the remaining $250,000 payment, staff reconcile the contract and retain its approval trail in a [closeout note](examples/lifecycle/09-closeout.md). Project closeout and appropriation-account closeout have different timing. A later authorized adjustment should reference the original decision and preserve it, rather than overwrite it.

## Try the pieces together

The [execution demo](./#execution-example) runs the same proportions at a $10 scale: $10 → $2.50 → $1 → $0.75 → $0.50. Select the payment to trace its authority, apply the approved reapportionment to see a preserved revision, or submit a $2 obligation to see an inconsistent event flagged. Evidence and source records export separately. These are working local computations using simulated sources and approvals.

For a real document review, edit the JSON and Markdown, run `npm run validate:budgets` and `npm run build`, then commit and open a PR. The generated page reads the same files; GitHub supplies the persistent review and merge record. No additional application server is needed for that workflow.

## Where blockchain could fit

Start with Git review and authoritative financial records. An approved apportionment or an agency-to-Treasury handoff may merit a shared verification receipt if independent participants need to check the same history. That receipt could bind the exact record digest, signer, approval, and parent references. Drafts, comments, contracts, and payment processing stay in their existing systems. A signed log may be sufficient initially.

A later UTXO design could represent successive approved authority states, referencing the outputs they revise or allocate and preserving the history. Budget amounts would be application data, separate from native coins and fees. The prototype does not submit blockchain transactions; the review and document toolkit already work without that layer.

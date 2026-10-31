# Reviewing the Patwin work-package request

The example is VAC-2026-PATWIN-001, a fictional $10,000 maintenance work package within the published $150,575 Patwin Park baseline. It is a prototype document review, not an actual City approval.

1. Add a named collaborator with write permission, and list their login in `.github/case-review-policy.json` on the approved branch. The PR author cannot satisfy the independent-review requirement.
2. Open the request PR and inspect its JSON amounts and Markdown funding basis. Comment on a specific line if scope or funding is unclear. Use **Request changes** when a correction is required.
3. The requester commits the response to the same PR. The final approval must reference the current head commit. The initial version remains in Git history.
4. The configured reviewer approves after resolving the questions. An authorized merger merges the exact reviewed document version into the approved branch.
5. Run `node scripts/github-case.js sync <number> --write`. It reads the trusted policy from the PR base commit, checks current-head reviews and merger identity, and compares the reviewed and merged file bytes. Only a valid merged approval produces an approval manifest.
6. Build the site. The status is a timestamped GitHub snapshot. Refresh the snapshot after review activity; browser controls do not write to GitHub.

A merged PR missing the configured review is displayed as **merged, approval unverified**. The prototype does not configure repository protection automatically; its evidence check fails closed. Actual City roles and spending controls would need separate confirmation.

The local execution replay uses demo signing keys. It remains labeled a simulation even after a real GitHub document approval. A shared chain could anchor selected evidence later; no wallet or network transaction is created by this workflow.

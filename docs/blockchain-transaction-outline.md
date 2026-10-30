# Transaction outline: 330,000 sats representing $330 million

A proposed experiment, not an implementation. Use **1 satoshi = $1,000 of represented public spending**, so 330,000 sats represents the user-supplied $330 million city budget figure for 2026. This is a fixed storytelling scale, not an exchange rate, dollar backing, or legal spending authority.

The existing [storyboard](../storyboard.md) supplies a $10 million bridge program inside that larger pool. Its FY 2028 federal process is illustrative; a city would use its own budget decisions and controls rather than OMB. The same transaction shapes can represent those local handoffs.

## Transaction table of contents

The complete path through partial payment is six transactions if a bootstrap transaction is needed. Final payment, closeout, and an adjustment are additional demonstrations. Each amount below is a **marker satoshi amount**, with fees funded separately.

| Tx | Event | Inputs → outputs | Supporting artifact |
| --- | --- | --- | --- |
| T0 | Initialize experiment | Existing sponsor coins → 330,000 city-pool marker + ordinary change | Approved city-budget reference, to be supplied; skip if marker already exists |
| T1 | Identify approved program | City pool 330,000 → program 10,000 + other-city-budget 320,000 | [Appropriation example](../examples/lifecycle/04-appropriation.md) |
| T2 | Release current-period authority | Program 10,000 → apportioned 2,500 + unapportioned 7,500 | [Apportionment](../examples/lifecycle/05-apportionment.md) |
| T3 | Allot to district | Apportioned 2,500 → district 1,000 + apportioned/unallotted 1,500 | [Allotment decision](../examples/lifecycle/06-allotment.md) |
| T4 | Record contract obligation | District 1,000 → obligated 750 + district/unobligated 250 | [Contract and obligation](../examples/lifecycle/07-obligation.md) |
| T5 | Attest partial payment | Obligated 750 → paid 500 + obligated/unpaid 250 | [Invoice and payment](../examples/lifecycle/08-payment.md) |
| T6 | Attest final payment | Obligated/unpaid 250 → paid 250 | Later payment described in [closeout note](../examples/lifecycle/09-closeout.md) |
| T7 | Optional reconciliation checkpoint | Paid 500 + paid 250 → reconciled 750 | Closeout note and retained audit manifest |
| TA | Optional approved adjustment | Unapportioned 7,500 + unallotted 1,500 → unapportioned 7,000 + unallotted 2,000 | [AP-002 scenario](../_data/execution_example.json), scaled to $3 million |

T0 transfers existing coins; it does not mint sats or enact a budget. T1 records an independently approved program. T5 and T6 attest payments made through financial systems; the experimental sats remain under demonstration custody, not with the contractor.

For demo authorization, use distinct role keys: budget authority for T1, apportionment reviewer for T2/TA, agency funds control for T3, contracting approval for T4, payment attestation for T5/T6, and reconciliation approval for T7. T0 also needs the sponsor’s coin signature. These role labels model the federal story; city roles would be mapped explicitly. All identities are simulated in the experiment.

## One connected UTXO history

Each named output has an outpoint, `txid:vout`. A transition spends its current output once and creates successor outputs. This follows the basic [UTXO transaction model](https://developer.bitcoin.org/devguide/transactions.html).

```text
330,000 city pool
├── 320,000 other city budget
└── 10,000 bridge program
    ├── 7,500 unapportioned
    └── 2,500 apportioned
        ├── 1,500 unallotted
        └── 1,000 district
            ├── 250 district/unobligated
            └── 750 contract
                ├── 500 paid
                └── 250 obligated/unpaid
```

After T5, the live leaves total exactly:

`320,000 + 7,500 + 1,500 + 250 + 500 + 250 = 330,000 sats`.

Do not add historical parent outputs to that total. Likewise, “paid” and “reconciled” markers are historical spending states, not available budget authority. The two 250-sat outputs have different meanings: unused district authority and an unpaid contractual obligation. T7 archives the paid markers without releasing them for another obligation.

TA spends the **current unspent remainders**, not the historical apportionment output already spent by T3. It increases the period ceiling from 2,500 to 3,000 while leaving district, contract, and payment descendants intact. The adjustment references the prior decision; history remains available.

## Events that need no transaction

Agency drafting, presentations, passback comments, appeals, revisions, the President’s proposal, and PR merges can remain entirely in Git. The [request JSON](../budgets/fy2027-28/bridge-request.json), [justification](../budgets/fy2027-28/bridge-request.md), and [review summary](../examples/lifecycle/02-passback.md) already convey this process. Merge approves that document version; it does not create an appropriation. An optional approved-document hash can accompany the next useful handoff instead of requiring a separate transaction.

## What a transaction should prove

A compact signed event should bind its event ID/type, account/fiscal year, USD amount in integer cents, scale, source-file SHA-256 manifest, approved Git commit and PR reference, parent/revision references, output-state mapping, and approving roles. Retain the actual documents, contracts, invoices, and payment reconciliation in Git or their authoritative systems. A digest proves a match to retained bytes, not their truth.

The application checks purpose, limits, approvals, role identity, and permitted transitions before proposing a spend. Signatures or multisig can control keys; ordinary signature checks do not understand budget law or enforce those semantic rules. That distinction follows from the [signature-script primitives](https://developer.bitcoin.org/reference/transactions.html). Consensus enforcement would require a separately specified, chain-supported design. A source record rejected by budget checks remains an application exception; it is not automatically a network-invalid transaction.

## Native-coin feasibility

Keep the 330,000 marker sats intact: add separate fee inputs and return sponsor change. Ordinary transaction fees are the input/output difference; they must not silently consume represented budget. See [transaction fees](https://developer.bitcoin.org/devguide/transactions.html#transaction-fees-and-change).

The 250-sat leaves expose a practical limit. Bitcoin Core computes dust thresholds by script and relay policy; its source illustrates 546 sats for typical P2PKH and 294 for P2WPKH at the documented default rate. Thus 250-sat ordinary outputs, and 500-sat P2PKH outputs, are problematic under those policies. These are policy-dependent examples, not universal consensus minimums. Check the selected chain, scripts, and node policy before constructing transactions. [Bitcoin Core dust policy](https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.cpp)

No chain is selected yet. If native-value outputs cannot support this scale, use coarser events, a permissioned test policy, or suitable carrier UTXOs with integer budget quantities in signed metadata. The latter gives up equality between output sats and budget units. Preserve exact dollar cents separately: one marker sat represents $1,000, so sub-$1,000 amounts need an explicit rounding/remainder policy; the live demo’s literal $0.50 is not representable at this scale.

Start with the transaction storyboard and local validation. A smaller receipt-only experiment could anchor selected approved handoffs without circulating budget-shaped coins at all.

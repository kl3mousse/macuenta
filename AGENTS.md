1. Scope

Shared-expense tracker (Tricount-like) as a WebXDC app.
All state = append-only events via webxdc.sendUpdate.
No external network. No timeline spam. Single currency (v1).

2. Entities
Expense
{
  id: string,          // UUID
  rev: number,         // starts at 1, increment on edits
  description: string, // ≤140 chars
  amountMinor: number, // integer cents
  currency: string,    // ISO4217, fixed once globally
  payer: string,       // participantId
  splits: Array<{
    participantId: string;
    mode: "even" | "weight" | "manual";
    weight?: number;        // if mode="weight"
    amountMinor?: number;   // if mode="manual"
  }>,
  createdAt: number,
  createdBy: string,
  editedAt?: number,
  editedBy?: string,
  deleted?: true
}

Participant
{
  id: string,             // chat addr/slug or UUID for external
  displayName: string,    // ≤60 chars
  origin: "chat" | "external",
  archived?: boolean,
  createdAt?: number,     // external only
  createdBy?: string,     // external only
  lastModifiedAt?: number,
  lastModifiedBy?: string
}

Settlement
{
  id: string,             // UUID
  from: string,           // participantId
  to: string,             // participantId
  amountMinor: number,
  createdAt: number,
  createdBy: string
}

3. Event Payloads

All envelopes:

{
 v: 1,
 type: string,
 ts: number,        // ms epoch
 actor: string,     // senderName or addr
 clientId: string,  // per-install stable id
 eventId: string    // UUID, dedupe
 // + type-specific body
}


Types:

expense.add / expense.edit / expense.delete

settlement.add

participant.add / participant.edit / participant.archive

meta.patch (globalCurrency)

noop

See spec examples for shapes.

4. Reconstruction Rules

Process updates in host serial order.

expense.*: last-wins by (rev,serial).

delete: only if rev > current.

participant.*: edits/archives only if origin="external".

settlement.add: immutable.

meta.patch: globalCurrency set once.

Ignore duplicates (eventId) or unknown type.

5. Split Computation

Manual amounts

Apply first.

Validation: sum(manuals) ≤ amountMinor.

If sum > total → reject client-side.

Remaining amount = amountMinor – sum(manuals).

Weight group

owed = round(rem * weight / totalWeight).

Last participant adjusted for rounding.

Even group

owed = floor(rem / countEven).

Last participant adjusted for rounding.

Mixing

Allowed. Manual fixed; remaining split across weight+even group.

If no group left and remainder ≠0 → reject client-side.

Final check

All owed values are integer minor units.

Assert sum(owed) = amountMinor ±1.

Distribute ±1 leftover to participant with largest share.

6. Derived State

Balances = sum(paid) – sum(owed) ± settlements.

Settlement suggestion = greedy match largest creditor vs largest debtor, tie-break by participantId.

Net balances must sum to 0 ±1.

7. UI / Client Guidelines

Bubble status

webxdc.setInfo({
  title: "macuenta",
  subtitle: "<n> expenses • <m> transfers to settle",
  image: "icon.png"
})


Subtitle ≤ 50 chars.

Examples: "0 expenses", "5 expenses • All settled", "12 expenses • 2 transfers to settle".

Timeline (info)

Only for human-readable events (e.g. “Alice paid Bob 23.50”).

Do not emit for routine expense CRUD.

Replay

Replay full log on load.

Idempotent, duplicate-tolerant.

8. Validation (Before sendUpdate)

Expense amount > 0

Description non-empty ≤ 140 chars

Splits: ≥1 participant

If manual: sum(manuals) ≤ total

If weight: all weights >0, sum(weights) ≤ 10,000

Settlement amount >0 and ≤ debtor balance

Currency matches global

9. Performance Targets

≤500 updates

≤50 participants

Replay complexity: O(U + E log P)
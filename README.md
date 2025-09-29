macuenta (Steps 1–5)
====================

This is the minimal WebXDC skeleton implementing Step 1 of the plan:

Implemented (Steps 1–5)
-----------------------
Step 1 (Skeleton):
- App title + minimal UI.
- Event log with `expense.add`, `noop`.
- Replay + dedupe by `eventId`.
- Expense counter + subtitle updates.
- Browser fallback.

Step 2 (Create Expense):
- Basic create form: title, amount (EUR), implicit payer = current user.
- Even split assumed (not yet stored) – just records core expense fields.
- Expense list rendering (title, payer, amount) sorted by creation time.
- Form validation: non-empty title, amount > 0.

Step 3 (Balances):
- Derive participant set from payers encountered.
- Even split of each expense across all currently known participants (dynamic global set for prototype).
- Deterministic rounding: floor share to each, distribute remainder +1 in lexicographic order of participant name.
- Net balance = paid total - owed total; positive means others owe them.
- Balance list shows signed amounts (green positive, red negative) and hides zero rows.

Step 4 (Settlement Suggestions):
- Greedy pairing: repeatedly match largest creditor with largest debtor.
- Tie-breaker: participant name lexicographic order when amounts equal.
- Generates minimal number of transfers for these greedy steps (not globally optimal in every pathological case, but standard heuristic and usually minimal).
- Subtitle now: "X expenses • All settled" or "X expenses • Y transfers to settle".

Step 5 (Edit & Delete Expenses):
- Added inline editing UI (click/tap an expense row to toggle edit mode).
- Edit: updates description and/or amount; bumps `rev`, sets `editedAt`, `editedBy` and emits `expense.edit` event.
- Delete: emits `expense.delete` tombstone (sets `deleted: true` + new `rev`).
- Last-wins logic by `rev` during replay (higher revision replaces lower).
- Balances & settlement suggestions recompute on every expense.* event.

Amount Representation Note
--------------------------
- All monetary values are stored as integer minor units (cents). Rendering always divides by 100.
- Earlier heuristic to interpret some values as already-major was removed to keep balances consistent.
- If legacy data with wrong scale appears, a migration layer (not implemented yet) should rewrite it instead of guessing at render time.

Not Yet Implemented (future steps)
----------------------------------
- Editing / deleting expenses.
- Participants, settlements, validation rules, real split logic.
- Persistence beyond the host-provided replay (no extra storage yet).

Manual Test Instructions (Step 4)
---------------------------------
1. Run dev mode:
  `npm run dev`
2. (Optional) Package and share in real chat: `npm run pack` and send the `.xdc`.
3. Open on two devices / accounts.
4. Initial state: subtitle `0 expenses`, empty list (hint shown).
5. Add an expense on Device A:
  - Title: Lunch
  - Amount: 12.50
  - Submit → appears in list; subtitle becomes `1 expense`.
6. Observe Device B after sync: the same expense line with amount and payer name.
7. Add another expense on Device B (e.g. Coffee 3.20) → both show `2 expenses` and two list entries.
8. Check balances section:
  - Suppose A added Lunch 12.50 and B added Coffee 3.20.
  - Participants: A, B (2 people).
  - Lunch: each owes 6.25 (A pays 12.50) → A balance +6.25, B balance -6.25.
  - Coffee: each owes 1.60 (B pays 3.20) → B +1.60, A -1.60.
  - Final: A +4.65, B -4.65 (allowing for cent rounding). Confirm displayed values.
9. Try noop: no list or balance change.
10. Add a third expense by A to verify balances adjust cumulatively.
11. Check Suggested Transfers list shows required payments. Apply them manually (mentally) to confirm balances would reach zero.

Settlement Example:
- A +4.65, B -4.65 → single transfer: B → A 4.65.
- A +10.00, B -6.00, C -4.00 → transfers: B → A 6.00, C → A 4.00.

Edit/Delete Test (Step 5)
-------------------------
1. Create two or more expenses.
2. Click one expense → edit mode appears (title, amount fields + Save/Cancel/Delete).
3. Change the amount and save; verify:
  - List updates everywhere (other device after sync).
  - Balances & suggested transfers refresh.
4. Delete the expense; verify it shows strikethrough (tombstone) or is excluded from balances.
5. Confirm subtitle updates if expense count changes (deleted items not counted).
6. Replay test: reload app → edited/deleted states persist (last rev wins).

Rounding Note:
- Remainder distribution may cause sum of balances to differ by ≤1 cent from naive manual math for intermediate steps, but net should still reconcile across all expenses.

Edge checks:
- Reject empty title (form won't submit due to required + trim logic).
- 0 or negative amount ignored (no event emitted).

Design Notes
-----------
- Each outgoing event is an envelope: `{ v:1, type, ts, actor, clientId, eventId, ... }`.
- Dedupe by `eventId` in memory; replay is idempotent.
- For Step 1 we only accept `expense.add` + `noop`; others are ignored so future expansion is safe.
- `expense.add` structure (subset): `{ id, rev, description, amountMinor, currency, payer, createdAt, createdBy }`.

Next Suggested Steps
--------------------
- Step 3: Introduce participants (auto-detect chat participants + manual external) and even split storage.
- Add internal split representation (manual/weight/even placeholders) aligning with spec.
- Implement edit & delete (rev bump + last-wins semantics).
- Derive balances + initial settlement suggestion logic.
- Validation enforcement per spec (weights, manual sums, etc.).
 - Switch per-expense participant set snapshot (instead of global evolving set) for historical accuracy.
 - Persist actual settlement events (immutable) instead of only suggestions.
 - UI action to mark a suggested transfer as done (emitting settlement.add event) and recomputing remaining suggestions.

License
-------
Prototype stage; add license details here.

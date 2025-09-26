macuenta (Step 1 Skeleton)
================================

This is the minimal WebXDC skeleton implementing Step 1 of the plan:

Implemented
-----------
- Blank-ish UI with app title: "macuenta".
- Event log with support for two event types: `expense.add` and `noop` (v=1 envelope subset).
- Local reconstruction of expenses map (last-wins by `rev`).
- Expense counter derived from non-deleted expenses.
- Chat bubble subtitle kept in sync: "0 expenses", "1 expense", "N expenses".
- Replay via `webxdc.setUpdateListener` (the host replays prior updates on load, which the listener processes idempotently).
- Browser fallback: when not inside a WebXDC host, sending an event simulates immediate local receipt.

Not Yet Implemented (future steps)
----------------------------------
- Editing / deleting expenses.
- Participants, settlements, validation rules, real split logic.
- Persistence beyond the host-provided replay (no extra storage yet).

Manual Test Instructions
-----------------------
1. Build / run the app locally:
   - Dev (in a normal browser for quick iteration):
     `npm run dev` (opens with webxdc-dev shim).
   - Pack an .xdc: `npm run pack` then share the generated file in a chat supporting WebXDC (e.g. Delta Chat).
2. Open the app in two different chat instances (or two devices/accounts) so each host distributes updates.
3. Observe initial subtitle: `0 expenses`.
4. In one instance, press "Add dummy expense" once. Subtitle should become `1 expense` in both peers after sync.
5. Add a few more; subtitles should increment accordingly across all peers.
6. Press "Send noop" — no visible change other than console log, ensuring unknown-impact events are handled (and idempotent dedupe works).

Design Notes
-----------
- Each outgoing event is an envelope: `{ v:1, type, ts, actor, clientId, eventId, ... }`.
- Dedupe by `eventId` in memory; replay is idempotent.
- For Step 1 we only accept `expense.add` + `noop`; others are ignored so future expansion is safe.
- `expense.add` structure (subset): `{ id, rev, description, amountMinor, currency, payer, createdAt, createdBy }`.

Next Suggested Steps
--------------------
- Implement proper split storage & validation (Step 2).
- Add edit/delete with rev-based last-wins logic.
- Persist derived balances & introduce settlement events.
- Basic participants management and external vs chat origin tracking.

License
-------
Prototype stage; add license details here.

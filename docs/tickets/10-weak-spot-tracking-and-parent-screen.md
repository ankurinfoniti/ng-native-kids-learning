# 10: Weak-spot tracking and Parent screen

**What to build:** A small "Parent" button on Home (no lock) opens a Parent screen showing best stars for every area and level, a list of weak items (for example "letter b", "number 17") and a "Reset progress" action. An item becomes weak when it was missed on the first try 2 or more times in its last 5 attempts, and leaves the list after 3 correct first tries in a row. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking)

**Status:** ready-for-agent

- [ ] Progress document records, per item id, the last 5 first-try outcomes and the current correct streak
- [ ] Every practice answer records a first-try outcome for its target item
- [ ] Weak rule: 2+ misses in last 5 → weak; 3 correct in a row → not weak
- [ ] Parent route shows best stars per area and level, and the weak list with each item's spoken name and area
- [ ] Reset progress asks for confirmation and then clears the saved document
- [ ] App-level tests cover entering the weak list, leaving it, showing it on the Parent screen and reset
- [ ] `npm test` and `npm run typecheck` pass

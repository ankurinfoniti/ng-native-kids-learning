# 03: Numbers L2 and L3

**What to build:** Once unlocked, Numbers level 2 (1-20) and level 3 (1-50) are playable. Questions cover recognising a number, counting objects (up to 10 at L2, up to 20 at L3), before/after/between and more/less. These levels use 4 answer tiles in a 2x2 grid, and wrong options include look-alikes (6/9, 12/21, 13/31 and neighbouring numbers). See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking)

**Status:** ready-for-agent

- [ ] Number items carry look-alike groups used first when choosing distractors
- [ ] L2 and L3 templates: recognise, count, before, after, between, which is more, which is less
- [ ] Counting visuals stay within the per-level cap (10 at L2, 20 at L3)
- [ ] L2 and L3 show 4 options in a 2x2 grid; L1 keeps 3
- [ ] App-level tests cover a level 2 round end to end, a "between" question and a look-alike distractor appearing (with deterministic Random)
- [ ] `npm test` and `npm run typecheck` pass

# 11: Weak items come up more often in practice

**What to build:** When a practice round is built, items on the weak list for that area and level are chosen more often than other items, so the child practises what he gets wrong. A round still has 10 questions and avoids repeating an item when the pool allows. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 10 (Weak-spot tracking and Parent screen)

**Status:** ready-for-agent

- [ ] Round builder uses weighted selection through the Random adapter, with weak items weighted higher
- [ ] With no weak items, selection is uniform as before
- [ ] No item repeats within a round unless the level's pool is smaller than 10
- [ ] App-level test: with a seeded weak item and deterministic Random, the weak item appears in the round more than an equivalent non-weak item would
- [ ] `npm test` and `npm run typecheck` pass

# 02: Saved progress and level unlocking

**What to build:** Tapping an area tile opens an Area screen listing its levels. Level 1 is open; later levels show 🔒 and do not start until the previous level earns 3 stars. Each level and the Home tile show the best stars earned. Progress is saved on the phone and is still there after the app is closed and reopened. Numbers lists levels 1-3 (levels 2-3 are locked placeholders until ticket 03 adds their content). See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 01 (Numbers L1 first playable round)

**Status:** ready-for-agent

- [ ] `@react-native-async-storage/async-storage` is installed; a Progress store adapter (`load()`, `save(state)`) is DI-provided and the real one stores one JSON document under a single key
- [ ] The progress document has a schema version, best stars per area+level and unlocked levels per area
- [ ] Area screen route lists the area's levels with best stars and 🔒 on locked levels; pressing a locked level does nothing
- [ ] Earning 3 stars unlocks the next level; only the best stars per level are kept
- [ ] Home tiles show the area's best stars
- [ ] Progress loads on start and saves after each round
- [ ] App-level tests with an in-memory Progress store cover: unlocking at 3 stars, not unlocking below 3, best stars kept after a worse round, progress surviving a fresh render with the same store, locked level not starting
- [ ] `npm test` and `npm run typecheck` pass

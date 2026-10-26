# 05: English area

**What to build:** An English 🔤 (blue) tile on Home opens 4 levels: L1 capital letters A-Z ("Tap the letter B"), L2 small letters a-z, L3 match capital to small ("Find small b for big B"), L4 starting sounds ("Which one starts with B?" with emoji options like 🍌 🐶 ⚽). Wrong options use look-alikes (b/d/p/q, m/n/w, C/G/O/Q, E/F). Levels unlock with 3 stars as in other areas. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking)

**Status:** ready-for-agent

- [ ] Item lists: capital letters, small letters, and one emoji word per letter for starting sounds, each with a stable id and spoken name
- [ ] Look-alike groups for letters used first for distractors
- [ ] Templates for the 4 levels; L1 uses 3 options, L2-L4 use 4
- [ ] Instructions spoken in English; letters spoken by name ("bee"), not phonetic sound
- [ ] App-level tests cover playing one round of L1 and an L4 question, and level unlocking for English
- [ ] `npm test` and `npm run typecheck` pass

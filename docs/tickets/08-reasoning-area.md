# 08: Reasoning area

**What to build:** A Reasoning 🧩 (pink) tile on Home opens 3 levels: L1 matching pairs ("Which one goes with the 🧦?" → 👟), L2 odd one out ("Which one is different?" 🍎🍌🍇🚗), L3 complete the pattern (🔴🔵🔴🔵❓). Matching pairs and some patterns come from a hand-written question set; odd-one-out is generated from General awareness categories. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking)

**Status:** ready-for-agent

- [ ] Hand-written question support: a question can be defined directly (prompt visual, options, correct answer, spoken lines) instead of from a template
- [ ] L1 matching pairs from a hand-written list (sock/shoe, toothbrush/toothpaste, cup/saucer, lock/key, pen/paper and similar)
- [ ] L2 odd one out generated as 3 items from one category plus 1 from another
- [ ] L3 patterns: generated AB and ABC patterns of emoji or colours, plus hand-written ones
- [ ] App-level tests cover a matching pair, an odd-one-out and a pattern question
- [ ] `npm test` and `npm run typecheck` pass

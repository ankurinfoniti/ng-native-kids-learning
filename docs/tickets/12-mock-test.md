# 12: Mock Test

**What to build:** A Mock Test 📝 (red) tile on Home starts a 12-question test that mixes questions from the areas, drawn from all levels regardless of unlock, shuffled. Each question allows one try with no hints and no timer. The end screen shows the score out of 12 and a per-area breakdown, spoken aloud. The result is saved and listed with its date in a Mock Test history on the Parent screen, and misses count toward weak spots. It uses whichever areas exist when it is built: 12 questions spread as evenly as possible across available areas (2 per area once all six of English, Numbers, Concepts, General awareness, Reasoning and Hindi exist). Oral is never included. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking), 10 (Weak-spot tracking and Parent screen)

**Status:** ready-for-agent

- [ ] Mock Test builder: 12 questions, evenly spread across registered areas (2 per area with all six), any level, shuffled
- [ ] Adding a new area later includes it in the Mock Test without changing the Mock Test itself
- [ ] One try per question: correct turns green, wrong shows the correct answer, then advances; no "Try again"
- [ ] Mock Results route shows total out of 12 and per-area scores, and speaks the total
- [ ] Progress document stores Mock Test history (date, total, per-area scores); Parent screen lists it newest first
- [ ] Mock Test answers record first-try outcomes for weak spots
- [ ] App-level tests cover composition with the areas available, one-try behaviour, results breakdown, history saved and shown on Parent, and misses feeding weak spots
- [ ] `npm test` and `npm run typecheck` pass

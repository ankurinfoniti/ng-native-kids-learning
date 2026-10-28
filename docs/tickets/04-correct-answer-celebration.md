# 04: Correct-answer celebration

**What to build:** When the child answers correctly, the green tile bounces, a ⭐ flies up from it and the voice says a praise phrase picked at random ("Well done!", "Super!", "Great job!", "You got it!"). The Results screen's stars animate in. No sound files and no mascot. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 01 (Numbers L1 first playable round)

**Status:** ready-for-agent

- [ ] Bounce and star fly-up use CSS `@keyframes` in component styles, driven by a bound attribute or class on the correct tile
- [ ] Praise phrase is chosen through the Random adapter and spoken in English
- [ ] Praise is also spoken on a correct second try (no point scored)
- [ ] Results stars animate in
- [ ] App-level tests assert the spoken praise for a deterministic Random sequence and that the celebrated state is applied to the correct tile
- [ ] `npm test` and `npm run typecheck` pass

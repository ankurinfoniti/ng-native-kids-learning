# 06: Concepts area

**What to build:** A Concepts 🔺 (purple) tile on Home opens 4 levels: L1 colours ("Tap red"), L2 shapes ("Tap the triangle": circle, square, triangle, rectangle, star), L3 big/small and tall/short ("Tap the big elephant"), L4 in/out and on/under ("Where is the cat? On the box or under the box?"). Colours and shapes are drawn in code as real coloured shapes, not emoji. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking)

**Status:** ready-for-agent

- [ ] Item visual type supports a code-drawn colour swatch and a code-drawn shape, alongside emoji and text glyphs
- [ ] Colour items: red, blue, yellow, green, orange, purple, pink, black, white, brown
- [ ] Shape items: circle, square, triangle, rectangle, star (star may use a glyph if a drawn star is impractical)
- [ ] L3 uses size-scaled emoji; L4 uses hand-written positional questions with emoji compositions
- [ ] Accessibility labels for drawn options equal their spoken name so tests and screen readers can find them
- [ ] App-level tests cover a colour round, a shape question and a big/small question
- [ ] `npm test` and `npm run typecheck` pass

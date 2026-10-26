# 13: Oral Parent mode

**What to build:** An Oral 🗣️ (teal) tile on Home opens Parent mode. The app shows and speaks one prompt at a time from a fixed list, and the parent taps ✓ or ✗ after the child answers aloud. Prompts: About me (name, age, mother's name, father's name, where he lives), Recitation (say a rhyme, count 1-20 aloud, say A-Z aloud), Describe a picture (emoji scene 🌳🏠☀️🐕👦, "What do you see?"), Favourites (colour, fruit, animal), Everyday questions ("What do you do with your toothbrush?", "Which animal says moo?"). The ✗ marks count toward weak spots and show on the Parent screen. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 10 (Weak-spot tracking and Parent screen)

**Status:** ready-for-agent

- [ ] Oral prompt list with stable ids, display text, spoken text and an optional emoji scene
- [ ] Oral route steps through prompts with ✓ and ✗ buttons and a 🔊 replay; ends with a summary of ✓ count
- [ ] Each ✓/✗ records a first-try outcome for the prompt's item id; weak oral prompts appear on the Parent screen labelled "Oral"
- [ ] Oral is excluded from the Mock Test and has no levels or stars
- [ ] App-level tests cover stepping through prompts, the spoken prompt, and ✗ marks making a prompt a weak spot
- [ ] `npm test` and `npm run typecheck` pass

# 09: Hindi area

**What to build:** A Hindi अ (yellow) tile on Home opens 2 levels: L1 vowels (स्वर) अ to अः, L2 consonants (व्यंजन) क to ज्ञ, recognition only ("अ पर टैप करो"). All instructions and feedback in this area are spoken with the Hindi voice. If the phone has no Hindi voice, the game still works with the default voice. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** 02 (Saved progress and level unlocking)

**Status:** ready-for-agent

- [ ] Item lists for Hindi vowels and consonants with spoken Hindi names
- [ ] Look-alike groups (ब/व, घ/ध, म/भ, प/ष, उ/ऊ, इ/ई)
- [ ] Instructions, "Try again", reveal and praise in this area are spoken with language `'hi'` (Hindi phrases)
- [ ] The Speaker falls back to the default voice when the Hindi voice is unavailable
- [ ] App-level tests assert Hindi questions are spoken with `'hi'` and cover a round of L1
- [ ] `npm test` and `npm run typecheck` pass

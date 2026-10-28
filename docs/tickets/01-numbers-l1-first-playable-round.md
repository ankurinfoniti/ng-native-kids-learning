# 01: Numbers L1 first playable round

**What to build:** The starter screen is replaced by "Bal Vatika Prep". A child opens the app, sees a Home screen with the Numbers 🔢 tile, taps it and plays a 10-question Numbers level 1 round (1-10: recognise a number, count objects, what comes before/after). Each question is spoken aloud in English and can be replayed with a 🔊 button. He answers by tapping one of 3 big tiles: a correct first tap turns the tile green and scores; a wrong first tap greys that tile and says "Try again!"; a second wrong tap highlights and speaks the correct answer. After 10 questions a Results screen shows 0-3 stars and speaks "You got N out of 10!". The Android back button returns to the previous screen. See the spec: [Bal Vatika Prep](../bal-vatika-prep.md).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `expo-speech` and `@ng-native/router` are installed; navigation uses native stack routes (Home, Round, Results) with component input binding
- [ ] Speaker (`speak(text, language)`, `stop()`) and Random (`next()`) are DI-provided adapters; the real Speaker wraps `expo-speech`
- [ ] Home shows the Numbers tile (orange, 🔢), app title "Bal Vatika Prep", light mode only
- [ ] Numbers L1 generates questions from the 1-10 item list via templates ("Tap the number N", "How many 🍎?", "What comes after N?", "What comes before N?") with 3 shuffled options and no duplicate options
- [ ] Each question's instruction is spoken in English when it appears; the 🔊 button repeats it; speech stops when leaving the screen
- [ ] Answer tiles are pressables with `accessibilityRole="button"` and a label equal to the option's spoken name, at least 120pt tall, glyphs 48pt or larger
- [ ] Practice answer flow: first-try correct scores a point; wrong first try greys the tile and says "Try again!"; correct second try advances with no point; wrong second try highlights and speaks the correct answer, then advances
- [ ] Stars from first-try correct out of 10: 9-10 = 3, 7-8 = 2, 5-6 = 1, below 5 = 0 with "Let's practise again!"
- [ ] Results screen shows the stars and speaks the score
- [ ] App-level tests (render, press, assert screen and spoken text) with a recording Speaker and deterministic Random cover: a full round, retry, reveal, star thresholds, replay, back navigation
- [ ] The starter counter and its test are removed; `npm test` and `npm run typecheck` pass

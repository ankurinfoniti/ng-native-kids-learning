---
title: Bal Vatika Prep - entrance exam practice game
labels: [ready-for-agent]
---

## Problem Statement

My son (age 4-5) has an admission test for Bal Vatika 2 (LKG) at Fr. Agnel School, Noida Sector 62. These tests usually check letters, numbers, colours, shapes, general awareness (fruits, animals, body parts), simple reasoning (odd one out, patterns), basic Hindi, and an oral interaction (name, parents' names, a rhyme). He cannot read yet, gets bored with worksheets, and I have no easy way to see which specific things he keeps getting wrong. I want a game on my Android phone that he can play on his own, that teaches him what the exam covers, and that tells me where he is weak.

## Solution

"Bal Vatika Prep", an Angular Native app for Android phones (portrait) that a child plays alone. Every question is read aloud by the phone's voice, and he answers by tapping big emoji or letter/number tiles. The home screen has one tile per exam area plus a Mock Test. Each area has levels that unlock as he earns stars. A wrong answer gets one retry, then the app shows and speaks the right answer. Correct answers are celebrated with a bounce, a flying star and spoken praise. An Oral mode lets a parent read prompts and mark answers. A Parent screen shows best stars, Mock Test history and a list of specific weak items, which the game also brings up more often in practice. All progress is saved on the phone.

## User Stories

### Home and navigation

1. As a child, I want a home screen with big colourful tiles for each area, so that I can pick what to play without reading.
2. As a child, I want each area tile to have its own colour and emoji (English 🔤 blue, Numbers 🔢 orange, Concepts 🔺 purple, General awareness 🌍 green, Reasoning 🧩 pink, Hindi अ yellow, Mock Test 📝 red, Oral 🗣️ teal), so that I recognise them by sight.
3. As a child, I want each area tile to show my best stars, so that I can see how well I am doing.
4. As a child, I want to tap an area and see its levels, so that I can choose which level to play.
5. As a child, I want locked levels to look locked (🔒) and not start, so that I understand I must earn them first.
6. As a child, I want the Android back button and back gesture to take me to the previous screen, so that I do not accidentally close the game.
7. As a parent, I want a small "Parent" button on the home screen, so that I can open the parent screens quickly.
8. As a parent, I want the app called "Bal Vatika Prep", so that it is easy to find on the phone.

### Spoken instructions

9. As a child who cannot read, I want every question read aloud when it appears, so that I know what to do.
10. As a child, I want a 🔊 button on every question that repeats the instruction, so that I can hear it again if I missed it.
11. As a child, I want instructions in English for English, Numbers, Concepts, General awareness and Reasoning, so that I get used to hearing English as in the exam.
12. As a child, I want the Hindi area spoken in a Hindi voice, so that I hear Hindi letters pronounced correctly.
13. As a child, I want speech to stop when I leave a question, so that old instructions do not talk over new ones.

### Answering questions

14. As a child, I want 4 big answer tiles in a 2x2 grid, so that I can tap the one I think is right.
15. As a child at the easiest levels, I want only 3 answer tiles, so that the question is not too hard.
16. As a child with small fingers, I want answer tiles at least 120 points tall with letters and numbers at 48pt or larger, so that I can tap them easily.
17. As a child, I want a correct tap to turn the tile green, bounce it, show a flying ⭐ and hear praise ("Well done!", "Super!", picked at random), so that I feel rewarded.
18. As a child, I want a wrong first tap to grey out that tile and hear "Try again!", so that I get one more chance.
19. As a child, I want the right answer highlighted and spoken ("This is a triangle") if my second try is also wrong, so that I learn the correct answer.
20. As a child, I want the next question to appear automatically after the feedback, so that the game keeps flowing.
21. As a child, I want answer positions shuffled every time, so that I learn the answer instead of its position.
22. As a child, I want wrong options that look or sound similar (b/d/p/q, 6/9, 🍎/🍅), so that I learn to tell them apart.

### Rounds, stars and levels

23. As a child, I want each practice round to have 10 questions, so that it ends before I get tired.
24. As a child, I want a results screen at the end with 1-3 stars and the voice saying "You got 8 out of 10!", so that I know how I did.
25. As a parent, I want only a correct first try to count toward the score, so that stars reflect what he really knows.
26. As a parent, I want 9-10 correct to earn 3 stars, 7-8 to earn 2 stars, 5-6 to earn 1 star and below 5 to earn none with "Let's practise again!", so that the reward matches performance.
27. As a child, I want the next level to unlock when I earn 3 stars, so that I move to harder questions once I am ready.
28. As a child, I want to replay any unlocked level, so that I can improve my stars.
29. As a parent, I want only the best stars per level kept, so that a bad round does not erase progress.

### Area content

30. As a child, I want Numbers level 1 to cover 1-10 (recognise a number, count objects, what comes before/after), so that I start easy.
31. As a child, I want Numbers level 2 to cover 1-20 (recognise, count up to 10 objects, before/after/between, more/less), so that I learn what most schools expect.
32. As a child, I want Numbers level 3 to cover 1-50 (same activities, counting capped at 20 objects), so that I am ready if the school asks higher numbers.
33. As a child, I want English levels for capital letters A-Z, then small letters a-z, then matching capital to small, then starting sounds ("Which starts with B?"), so that I learn letters step by step.
34. As a child, I want Concepts levels for colours, then shapes (circle, square, triangle, rectangle, star), then big/small and tall/short, then in/out and on/under, so that I learn basic concepts.
35. As a child, I want General awareness levels for fruits and vegetables, then animals with their sounds and birds, then body parts, vehicles and family members, so that I know everyday things.
36. As a child, I want Reasoning levels for matching pairs, then odd one out, then completing patterns (🔴🔵🔴🔵❓), so that I practise thinking questions.
37. As a child, I want Hindi levels for vowels (अ to अः), then consonants (क to ज्ञ), recognition only, so that I know basic Hindi letters.
38. As a child, I want colours and shapes drawn as real coloured shapes, so that they look exactly like what they are.

### Mock Test

39. As a parent, I want a Mock Test of 12 questions (2 from each of English, Numbers, Concepts, General awareness, Reasoning, Hindi), shuffled, so that he rehearses the mixed format of the real exam.
40. As a parent, I want the Mock Test to draw from all levels, including locked ones, so that it reflects the real exam rather than his unlock progress.
41. As a child, I want only one try per Mock Test question and no hints, so that it feels like a real test.
42. As a child, I want no timer in the Mock Test, so that I do not feel rushed.
43. As a parent, I want a final Mock Test screen with the score out of 12 and a per-area breakdown, so that I see which areas need work.
44. As a parent, I want every Mock Test result saved with its date and per-area breakdown, so that I can see improvement over time.
45. As a parent, I want Mock Test misses to count toward weak spots, so that the exam rehearsal also feeds practice.

### Oral (Parent mode)

46. As a parent, I want an Oral mode that shows and speaks one prompt at a time, so that I can run the oral part of the exam with him.
47. As a parent, I want ✓ and ✗ buttons for each prompt, so that I can mark whether he answered well.
48. As a parent, I want "About me" prompts (name, age, mother's name, father's name, where he lives), so that he practises introducing himself.
49. As a parent, I want recitation prompts (say a rhyme, count 1-20 aloud, say A-Z aloud), so that he practises speaking confidently.
50. As a parent, I want a "describe a picture" prompt with an emoji scene (🌳🏠☀️🐕👦), so that he practises describing what he sees.
51. As a parent, I want favourites prompts (favourite colour, fruit, animal), so that he is ready for small-talk questions.
52. As a parent, I want everyday-knowledge prompts ("What do you do with your toothbrush?", "Which animal says moo?"), so that he practises general questions.
53. As a parent, I want ✗ marks on oral prompts to count toward weak spots, so that I see which oral questions he struggles with.

### Parent screen and progress

54. As a parent, I want a Parent screen showing best stars for every area and level, so that I see his overall progress.
55. As a parent, I want a list of specific weak items (for example "letter b", "number 17", "Oral: father's name"), so that I know exactly what to practise.
56. As a parent, I want an item to become a weak spot when he missed it on the first try 2 or more times in its last 5 attempts, so that one-off mistakes are not flagged.
57. As a parent, I want an item to leave the weak list after 3 correct answers in a row, so that the list stays current.
58. As a parent, I want weak items to appear more often in practice rounds, so that the game focuses on what he does not know yet.
59. As a parent, I want the Mock Test history listed with dates and scores, so that I can track readiness before the exam.
60. As a parent, I want a "Reset progress" action, so that I can start fresh (for example for a sibling).
61. As a parent, I want all progress saved on the phone and kept after the app is closed, so that nothing is lost between sessions.

### Look and feel

62. As a child, I want bright, high-contrast pastel colours and large rounded tiles, so that the game is easy and pleasant to look at.
63. As a parent, I want the app always in light mode, so that the colours stay bright and consistent even if the phone is in dark mode.
64. As a parent, I want the layout built for Android phones in portrait (Samsung S24, Pixel 10a), so that it fits the devices we use.
65. As a parent, I want the layout to use flexbox, so that it still works on an iPhone or tablet later.

## Implementation Decisions

- **Platform**: Angular Native on Expo, tested on Android through Expo Go. Signals and zoneless change detection throughout. Light mode only.
- **New dependencies**: `expo-speech` (text-to-speech, English and `hi-IN`), `@react-native-async-storage/async-storage` (local persistence) and `@ng-native/router` (native stack navigation with Android back support).
- **Routes**: Home, Area (level picker for one area), Round (practice questions for an area + level), Results (stars), Mock Test, Mock Results, Oral (Parent mode) and Parent (progress, weak spots, history, reset). Route params arrive as component inputs via `withComponentInputBinding()`.
- **Platform adapters behind DI tokens** (the only boundaries swapped in tests):
  - **Speaker**: `speak(text, language)` and `stop()`. Language is `'en'` or `'hi'`. The real implementation wraps `expo-speech`.
  - **Progress store**: async `load()` and `save(state)` of one serialised progress document. The real implementation wraps AsyncStorage under a single key.
  - **Random**: `next(): number` in [0, 1). All shuffling, distractor choice and item selection go through it.
- **Content model**: each area defines **item lists** (letters, numbers, colours, shapes, fruits/vegetables, animals with sounds, birds, body parts, vehicles, family members, Hindi vowels/consonants, oral prompts). Each item has a stable id (for example `number:17`, `letter-upper:B`), a spoken name, a visual (emoji, text glyph or a code-drawn shape/colour) and an optional look-alike group for distractors. The visual type leaves room for a bundled image later.
- **Question model**: a question has an area, level, target item id, spoken instruction and language, a visual prompt (optional, for example 🍎🍎🍎 to count), a list of options (one correct) and a spoken "correct answer" line. Questions are produced by **templates per level** (for example "Tap the number {n}", "How many {emoji}?", "What comes after {n}?", "Which one is different?") plus a small set of **hand-written questions** (picture scenes, specific patterns).
- **Distractors**: picked from the target's look-alike group first (b/d/p/q, 6/9, 🍎/🍅), then from the same level's item list; never duplicates; option order shuffled.
- **Round builder**: 10 questions for practice; weighted selection gives weak items a higher chance; no item repeats in a round where the pool allows. 3 options at each area's first level, 4 options otherwise.
- **Mock Test builder**: 12 questions, 2 per area (English, Numbers, Concepts, General awareness, Reasoning, Hindi), from any level regardless of unlock, shuffled. One try per question, no hints, no timer.
- **Answer flow (practice)**: first tap correct → score point, success feedback. First tap wrong → tile greyed, "Try again!". Second tap correct → praise, no point. Second tap wrong → highlight and speak the correct answer. Then advance.
- **Scoring**: stars from first-try correct count out of 10: 9-10 → 3, 7-8 → 2, 5-6 → 1, otherwise 0. Next level unlocks at 3 stars. Only the best stars per level are kept.
- **Weak-spot rules**: each item keeps its last 5 first-try outcomes (practice, Mock Test and Oral). It becomes weak with 2+ misses in those 5 and stops being weak after 3 correct in a row. Weak items are listed on the Parent screen with their spoken name and area.
- **Progress document** (persisted as one JSON value): best stars per area+level, unlocked levels per area, per-item recent outcomes and streak, Mock Test history (date, total, per-area scores). A schema version field allows future migration. Reset clears it.
- **Celebration**: correct tile turns green, bounces and a ⭐ flies up using CSS `@keyframes` in component styles; praise phrase chosen via the Random adapter. No sound files and no mascot.
- **Accessibility**: answer tiles are `pressable` with `accessibilityRole="button"` and an `accessibilityLabel` equal to the option's spoken name; this also lets tests find them by role and name.
- **Delivery order**: first a working vertical slice (Home → Numbers level 1 → Round → Results, with speech, retry, stars, unlocking and persistence), reviewed on a phone; then the remaining areas, Mock Test, Oral and Parent screens following the same pattern.

## Testing Decisions

- **Good tests check behaviour you can see from outside**: what is on screen, what was spoken (text and language) and what was saved. They do not check internal services, signals or private methods, so code can be restructured without rewriting tests.
- **One test seam, the rendered app**: tests render the root component with the native router via `@ng-native/testing`, query with `screen.getByRole` / `getByText` / `getByTestId`, and act with `userEvent.setup().press(...)`.
- **Adapter fakes provided through DI**: a recording Speaker (asserts "Tap the number 7" was spoken in `'en'`, Hindi prompts in `'hi'`), an in-memory Progress store (seeded with prior progress, or inspected after a round) and a deterministic Random (fixed sequence so option order and praise are predictable).
- **What to cover through the app**: home tiles and best stars; level locking and unlocking at 3 stars; the 10-question round; retry then reveal; first-try-only scoring and star thresholds; the results screen and spoken score; the 🔊 replay; back navigation; Hindi area speaks `hi`; Mock Test composition (12 questions, 2 per area, one try, breakdown saved to history); Oral ✓/✗ feeding weak spots; weak-spot entry (2 of last 5) and exit (3 in a row); weak items weighted in practice; progress surviving a fresh render with the same store; reset.
- **Prior art**: the starter app test, which renders the root component and presses a button found by role and name.
- **Every change**: run `npm test` and `npm run typecheck`.
- Only if app-level tests for content generation get slow or unwieldy should a second, lower seam be added for the question/round builders.

## Out of Scope

- Motor-skill tasks (tracing, colouring, writing his own name).
- Speech recognition or automatic marking of oral answers.
- Sound-effect files, background music and a mascot character.
- Bundled image assets (emoji only for now; the content model allows images later).
- In-app editing of questions or oral prompts.
- Accounts, cloud sync, multiple child profiles and parental lock/PIN.
- Timers in any mode.
- Dark mode, landscape/tablet-specific layouts and iOS-specific tuning.
- Hindi matras, words, and writing practice.
- Content verified against Fr. Agnel School's actual past papers (none were available).

## Further Notes

- Content is based on what Delhi-NCR schools commonly test for Bal Vatika 2 (LKG) admissions, not on verified Fr. Agnel past papers. If the school's syllabus or a sample paper becomes available, the item lists and levels should be adjusted to match.
- On some Android phones the Hindi (`hi-IN`) voice must be downloaded once in system text-to-speech settings; the app should still work (falling back to the default voice) if it is missing.
- Target test devices: Samsung Galaxy S24 and Google Pixel 10a, in portrait.

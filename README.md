# Korean Study

A small static site for daily Korean practice:

- **Today**: a daily review (seeded by date, so it stays the same all day) built from the grammar topics you've ticked, plus verb conjugations and numbers. It leans toward your weakest topics. It also shows a set of 5 new words (you get a fresh set each time you add one to Anki, so breaks never pile up words), with one-click "Add to Anki".
- **Grammar**: all 93 topics from *Anytime Korean Beginning 1 & 2* (Lessons 1–20). Tick what you've learned, read the explanations and examples (with audio), and practice by topic, by lesson or everything you've learned.
- **Numbers**: Sino-Korean and native numbers, counters, age, money, time, dates, years, days of the week, months and phone numbers. Four modes: read, listen, Korean → number, and say it aloud. 60-second sprints with a best score.
- **Verbs**: fast conjugation drills for 27 forms (present, past, honorific, -(으)ㄹ게요, -는데, modifiers, -습니다 …), including ㅂ/ㄷ/ㅅ/르/ㅎ/ㄹ/ㅡ irregulars, plus a conjugation table.
- **Words**: today's words, a review quiz, and Anki export.

Answers are always typed, never multiple choice. Spacing and punctuation are ignored, and you can also type the whole sentence. "I was right" overrides the checker.

## Run locally

```sh
npm start          # serves ./site on http://localhost:5173
npm test           # checks the conjugation engine and every question generator
```

(Or run `python -m http.server 5173` in `site/`. ES modules need a server, so opening the file directly won't work.)

## Deploy to AWS Amplify

1. Push this repo to GitHub, GitLab, Bitbucket or CodeCommit.
2. In the Amplify console: **Create new app → Host web app**, connect the repo and branch.
3. Amplify picks up `amplify.yml`: it runs the tests and serves the `site/` folder. No build step and no backend.

(Or use **Deploy without Git**: drag a zip of the *contents* of `site/` into Amplify.)

## Anki

Install [AnkiConnect](https://ankiweb.net/shared/info/2055492159) (code `2055492159`). In Anki → Tools → Add-ons → AnkiConnect → Config, add your Amplify URL (and `http://localhost:5173` for local use) to `webCorsOriginList`, then restart Anki. Keep Anki open when you click "Add to Anki". Duplicates are skipped.

If the browser can't reach Anki (Safari blocks it, for example), use **Download for Anki** and open the `.apkg` file. Deck names and note type are under Settings.

On a phone or tablet there's no AnkiConnect, so **Add to Anki** builds an `.apkg` file in the browser (`site/js/apkg.js`, using sql.js from cdnjs) and opens the share sheet: pick Anki (AnkiMobile or AnkiDroid). The file brings its own deck and note types, and note IDs come from the word, so importing a word again doesn't duplicate it.

## Data

Progress is stored in your browser's localStorage. Use Settings → Export / Import to move it between devices.

## Adding content

- Grammar topics and question generators: `site/js/data/grammar.js`
- Daily words: `site/js/data/vocab.js`
- Verbs and adjectives for drills: `site/js/data/words.js`

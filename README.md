# A Birthday Surprise 🎂

A mini interactive birthday experience: opening → blow out candles →
open a letter → unwrap four chocolates (one needs a phone shake!) →
open a final gift → a memory gallery → a big final screen. Built with
plain HTML, CSS and JavaScript — no build step, no frameworks, no
install required.

## 1. How to run it locally

You can't just double-click `index.html` — some browser features
(microphone, motion, loading config.js as a module-like script) need
the page to be served over `http://`, not opened as a bare `file://`
path. Any of these work:

**Option A — Python (already on most Macs/Linux, and on Windows via
the Microsoft Store):**
```
cd birthday-surprise
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option B — Node.js:**
```
cd birthday-surprise
npx serve .
```

**Option C — VS Code:** install the "Live Server" extension, right
click `index.html`, choose "Open with Live Server".

## 2. Where to personalize everything

Open **`js/config.js`**. It's the only file you need to touch, and
it's written in plain English with a clearly marked header:

```
// ✨ BIRTHDAY WEBSITE CUSTOMIZATION
```

Inside, replace:
- `friendName` / `yourName` — the two names used across the site
- `envelope.message` — the first personal message
- `chocolates.small.message`, `chocolates.dairyMilk.message`,
  `chocolates.big.message` — the three remaining chocolate messages
  (the toffee message is already written for you, but feel free to
  change it too)
- `gift.letter` and `gift.signOff` — the final birthday letter
- `finalScreen.heading` / `finalScreen.lines` — the last screen's text
- `memories` — your photo gallery (see below)
- `music` — your audio files (see below)

Every placeholder is wrapped in `[LIKE THIS]` so they're easy to spot.

## 3. Adding photos

1. Put your image files in `assets/photos/` (jpg or png, any names
   you like — `memory1.jpg`, `beach-trip.jpg`, whatever).
2. In `js/config.js`, update the `memories` array so each entry's
   `image` points at the right file, and write a `caption` (and an
   optional `date`) for it.
3. Add or remove entries freely — the gallery adjusts automatically.
   If a listed image is missing, that card just shows a soft
   placeholder icon instead of breaking.

## 4. Adding / changing music

1. Put mp3 files in `assets/music/`.
2. In `js/config.js`, set `music.src` to your background track, and
   `music.sfxCandle` / `sfxUnwrap` / `sfxOpen` / `sfxConfetti` to
   short sound effects for those moments.
3. Leave any of these as `""` if you don't have a file for it — the
   site works perfectly with partial or no audio. Nothing autoplays
   (browsers block that anyway); your friend taps the 🔇/🔊 button in
   the top-right to turn music on, any time after the page loads.

## 5. How the tricky interactions work (and their fallbacks)

- **Blowing out the candles:** tapping "Allow microphone" lets the
  site listen for a blow (a sustained loud sound). If the mic is
  denied, unavailable, or just not the person's thing, the
  "Tap / hold here to blow them out" button always works — hold it
  down for about a second.
- **Shaking the Dairy-Milk-style bar:** on a phone, physically
  shaking it fills the meter through the device's motion sensor
  (iOS will ask permission the first time). If motion isn't
  available, "Tap repeatedly" fills the same meter just as well.

Neither interaction can ever get "stuck" — there's always a manual
way through.

## 6. Deploying it so you can send a link

Any static-hosting service works since this is plain HTML/CSS/JS.
Two easy free options:

**Netlify Drop (fastest, no account needed for a quick test):**
Go to https://app.netlify.com/drop and drag the whole
`birthday-surprise` folder in. You'll get a shareable link in
seconds.

**GitHub Pages:**
1. Create a new GitHub repository and push this folder's contents to
   it.
2. In the repo's Settings → Pages, set the source to the `main`
   branch, root folder.
3. Your site will be live at
   `https://your-username.github.io/your-repo-name/`.

**Vercel:** `npx vercel` from inside the folder also works if you
have a Vercel account.

Whichever you use, just make sure the whole folder — `index.html`,
`css/`, `js/`, and `assets/` — gets uploaded together.

## Project structure
```
birthday-surprise/
├── index.html          ← all the scenes/markup
├── css/style.css        ← all visual styling & animations
├── js/config.js          ← 🎯 EDIT THIS for personalization
├── js/main.js             ← the interaction logic (shouldn't need edits)
├── assets/photos/         ← put your photos here
└── assets/music/          ← put your mp3s here
```

Happy Birthday, from one best friend's careful planning to another. 🎉

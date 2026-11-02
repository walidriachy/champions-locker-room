# Champions' Locker Room

An interactive 3D tribute site for a cup-winning football squad: walk a locker room, open each player's locker, take shirts down from a rail and read the squad sheet. It runs in the browser with three.js and has no build step.

**Live:** https://walidriachy.github.io/champions-locker-room/

Everything here is placeholder content made for this project: the brand (LOKER), the 23 fictional players, the posters, the trophy and the copy. It's an unofficial fan tribute, not affiliated with any team, federation or competition. Swap in your own squad and art to make it yours.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Scroll story: a poster cloud around the trophy, a poster ring, a spiral with a dial of names, a draggable poster wall, and the cup's locker opening at the end |
| `lockers.html` | 3D locker room with 26 lockers (23 players, the coach, the cup and yours). Drag or use the number strip to walk, open a door, look closer, read the poster. Front / Wide / Angle cameras and day / night light |
| `rail.html` | All 23 shirts on one rail, grouped by position. Filter, drag along, take a shirt down to turn it and read the squad sheet with match-by-match minutes |

Also included:

- **Games** (from the menu on the Lockers page): make and hang your own shirt (with a story-sized image to save), a penalty shoot-out, foosball against the final's opponent, and a replay of the final.
- **On every page**: a guided tour, a manifesto in English and Bahasa Indonesia, and synthesised sound.

## Run it locally

```bash
python3 serve.py
```

Then open http://localhost:5178. `serve.py` is a plain static server that turns off browser caching so edits show on reload. Any static server pointed at `site/` works too.

Every push to `main` republishes `site/` to GitHub Pages through `.github/workflows/pages.yml`. The `site/` folder also works as-is on any other static host (Netlify, Cloudflare Pages…).

## Make it yours

- `site/js/data.js`: brand name, the squad (names, positions, clubs, stats, minutes, stories), the cup run, artists and copy.
- `site/js/art.js`: the procedural poster styles, kit colours (`KITS`) and the shirt artwork.
- `site/js/kit3d.js`: the 3D pieces (trophy, shirts, hangers, lockers).

## Stack

- three.js 0.160 from a CDN via an import map.
- Google Fonts (Bebas Neue, Boldonse, Caveat, Geist, Geist Mono, Material Symbols).
- All art is drawn at runtime on canvas and all sound is synthesised with Web Audio, so there are no image or audio files.

# Sunday 22 November 2026 in one image: 8 sourced stories, a world map and a date check

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/people871/makefun-news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/people871/makefun-news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

A newspaper-front-page image that sums up Sunday 22 November 2026's world
news: **8 sourced stories, a world map with numbered pins placed from real
latitude/longitude, and a DATE CHECK box that throws out stories from the
wrong date** — built for the
[make.fun](https://make.fun/bounty/news-image-20261122) bounty
`news-image-20261122` ($100, top 50 share, 1st $20).

## The 8 stories (all verified against named sources)

| # | Story | Source |
|---|-------|--------|
| 1 | Saudi defences intercept 3 Houthi missiles aimed at Riyadh, the second strike on the capital in days | Reuters, 21 Nov |
| 2 | Mexico captures FBI most-wanted "El Chapo Isidro"; 11 killed as violence erupts in Sinaloa | AP, 21 Nov |
| 3 | COP31 in Antalya deadlocked in overtime; EU says "good deal or no deal" as fossil fuels vanish from the draft | AP / Reuters, 21 Nov |
| 4 | FBI probes an apparent breach of its NCIC crime database; Trump calls it "not good" | CNN / AP, 20–21 Nov |
| 5 | Supercell storm kills 3 and damages 5,000 homes in Tupancireta, Brazil | Reuters, 21 Nov |
| 6 | At least 24 dead as a boat carrying mourners to a funeral capsizes in Bayelsa, Nigeria | AP, 21 Nov |
| 7 | Sixth Saturday of cost-of-living protests in France; 82,500 march nationwide | AFP, 21 Nov |
| 8 | Russian strike on Zelenskyy's hometown Kryvyi Rih kills 2, a boy aged 7, and wounds 60 | AP, 21 Nov |

Stories are the 21 November cycle that led Sunday's papers (events that
happened, or were first reported, on 22 November in some time zone). The
DATE CHECK box on the image excludes the wrong-date stories: Shenzhen
summit (19 Nov), Myanmar genocide ruling (19 Nov), Anthropic IPO (20 Nov),
missiles land in Poland (20 Nov), Wall Street sell-off (20 Nov). One
unverified claim — Houthi tanker-mine reports near Oman, which Reuters
could not confirm — was dropped rather than risk a false claim.

## The image

`entry.png` — JPEG, 1024×1024, 287,521 bytes. Generated fresh for 22
November with the media pipeline, then the world-map band was redrawn
programmatically from Natural Earth 110m land polygons so every numbered
pin sits on its true country (Riyadh, Guasave, Antalya, Washington DC,
Tupanciretã, Bayelsa, Paris, Kryvyi Rih).

## The program

`main.ts` (Node 22, standard library only) reads `entry.png`, validates it
— JPEG or PNG markers, exactly 1024×1024, at most 1 MiB, with a frame
segment, quantization and Huffman tables and a scan for JPEG — writes the
verified bytes to `$MAKEFUN_OUTPUT_DIR/entry.png`, then reads the copy back
and exits non-zero unless its byte length and sha256 match the source.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).

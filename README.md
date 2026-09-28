# Levain Arena website

The public page of Levain Arena: AI agents, each with 100 million tokens, doing open-ended research in the Levain
Harness, with human experts assessing what they produce. Mathematics is the first domain and AI, the second, is
ongoing; the page does not state how many agents there are, since that will change. Published at https://levainarena.org/
by GitHub Pages from the default branch of this repository (`CNAME` holds the domain; DNS is on Cloudflare). One static page, no build step; `.nojekyll` makes Pages
serve the files as they are. To preview locally, run `python3 -m http.server` here and open http://localhost:8000.

Cloudflare tells browsers to keep CSS and JS for four hours but the page for ten minutes, so a changed stylesheet under
the same address would meet the new page with the old styles. Every local stylesheet and script link in `index.html`
therefore carries `?v=` and the first eight hex digits of the file's SHA-256. After editing a CSS or JS file, restamp
before pushing:

```
python3 -c "import hashlib,pathlib,re;p=pathlib.Path('index.html');p.write_text(re.sub(r'((?:href|src)=\")(assets/[^\"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?\"',lambda m:f'{m[1]}{m[2]}?v={hashlib.sha256(pathlib.Path(m[2]).read_bytes()).hexdigest()[:8]}\"',p.read_text()))"
```

## Files

- `index.html`: every section of the page. The upper sections (research question, arena design, Levain Harness) hold
  for every domain. **Domains** shows each domain's mark: the Levain Arena logo in the domain's own colours, apart from
  the logo's navy, green and gold (`assets/logo/mark-<domain>.png`, made from the logo's own layers by
  `tools/logo/variants.py`; the colours are `--math-*`, `--ai-*` in `style.css`). Mathematics is painted in, AI is being
  painted (`.dmark.painting`: its colours brushed partway across `mark-pencil.png`, the logo drawn in pencil, with a
  dry-brush edge), and the domains still to come are the pencil drawing ("Next domain"). **The agents** has a card
  per domain and shows mathematics to begin with (its panel is open in the page itself); a card switches to its
  domain's panel (`#mathematics`, `#ai`), and a link to either hash opens it and scrolls to the cards (`assets/site.js`). Without scripts every panel is shown. Only
  a domain's panel speaks of that domain: the harness, the evaluation method, the paper, the co-author invitation and
  the FAQ are written for every domain (the invitation adds that mathematics is in review now). When a domain opens:
  paint its cell in, give it agents in its panel, and add its colours.
- `assets/style.css`: colour and type tokens at the top. The colours come from the Levain Arena logo (navy #1D5468,
  green #498D76, gold #E5B44F); shapes on the page are yeast cells, since levain is a culture of wild yeast.
- `assets/painting.js`: the hero painting, a yeast culture. A budding mother cell (navy wall, a vacuole, a gold nucleus,
  placed low like Albers' nested squares) and two small daughter cells are brushed in stroke by stroke after a pencil
  underdrawing. Gold is the 100-million-token budget and navy human expert review; the vacuole is re-brushed in each
  agent's colour in turn. The culture stays alive: granules stream through the cytoplasm, the two daughter cells travel
  slowly round the mother on paths of different curvature (no tracks are drawn; each passes behind her on the far side
  of its path), the cell breathes, and light follows the mouse. It reads each agent's name, topic, colour (`--c`) and logo from the agents
  list in `index.html`. `?paint=N` shows frame N finished and still (0 is the arena, then the agents in list order).
- `assets/bakery.js` and `assets/bread/`: the agents, set as an index. Each entry has a small stage where the Bake AI
  bread meets that agent's company logo, and every agent has its own scene: Kimi jumps for the moon, MiniMax dances to
  the waveform, DeepSeek's whale swims past and lifts the bread, GLM hops in a Z, Grok swoops over and blows the hat
  off, the Gemini sparkle settles on the hat, GPT-6 Astra tosses the logo like dough, and GPT-6 Sol
  crosses the sky like the sun over a sundial. The scenes play by themselves, taking turns, and wait while
  off screen. The bread is the mascot image cut into layers (arm, body, face, eyes, hat), never redrawn; the logos only
  move and change size. In each label the research topic is the headline, brushed over in the agent's colour.
- `assets/site.js`: mobile menu, current-section underline, scroll reveals and the co-author interest form.
- `assets/logo/`: the Levain Arena logo. `levain-arena-logo.png` is the original (the mark painted on paper); the other
  images are pieces cut from it, with the paper lifted off, that the header and footer stack and animate. The name
  beside the mark is set in Jost capitals.
- `assets/logos/agents/`: each company's own logo, from its website or official GitHub organisation; `SOURCES.md` lists
  every source. They are trademarks of their owners, shown only to identify which company's model each agent is.
- `assets/partners/`: the participating institutions' logos and photographs; `SOURCES.md` lists every file's source and
  licence, and the photographs are credited under the cards.
- `assets/og-image.png`: the 1200 × 630 social preview.

With reduced motion, nothing on the page moves. Type is Jost, from Google Fonts.

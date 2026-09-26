# Levain Arena website

The public page of Levain Arena: AI agents, each with 100 million tokens, doing open-ended research in the Levain
Harness, with human experts assessing what they produce. Mathematics is the first domain; the page does not state how
many agents there are, since that will change. Published at https://levainarena.org/
by GitHub Pages from the default branch of this repository (`CNAME` holds the domain; DNS is on Cloudflare). One static page, no build step; `.nojekyll` makes Pages
serve the files as they are. To preview locally, run `python3 -m http.server` here and open http://localhost:8000.

## Files

- `index.html`: every section of the page. The upper sections (research question, arena design, Levain Harness) hold
  for every domain; **Domains** shows mathematics as a painted yeast cell and the domains still to come as pencil
  outlines ("Next domain"), and opening a domain means painting one in; the mathematics domain then opens with its own
  heading (`#mathematics`), and the agents, evaluation, paper and co-author invitation below it belong to it.
- `assets/style.css`: colour and type tokens at the top. The colours come from the Levain Arena logo (navy #1D5468,
  green #498D76, gold #E5B44F); shapes on the page are yeast cells, since levain is a culture of wild yeast.
- `assets/painting.js`: the hero painting, a yeast culture. A budding mother cell (navy wall, a vacuole, a gold nucleus,
  placed low like Albers' nested squares) and two small daughter cells are brushed in stroke by stroke after a pencil
  underdrawing. Gold is the 100-million-token budget and navy human expert review; the vacuole is re-brushed in each
  agent's colour in turn. The culture stays alive: granules stream through the cytoplasm, the two daughter cells travel
  slowly round the mother on paths of different curvature (no tracks are drawn; each passes behind her on the far side
  of its path), the cell breathes, and light follows the mouse. It reads each agent's name, topic, colour (`--c`) and logo from the agents
  list in `index.html`. `?paint=N` shows frame N finished and still (0 is the arena, 1 to 9 the agents).
- `assets/bakery.js` and `assets/bread/`: the agents, set as an index. Each entry has a small stage where the Bake AI
  bread meets that agent's company logo, and every agent has its own scene: Kimi jumps for the moon, MiniMax dances to
  the waveform, DeepSeek's whale swims past and lifts the bread, GLM hops in a Z, Grok swoops over and blows the hat
  off, the Gemini sparkle settles on the hat, GPT-6 Astra tosses the logo like dough, GPT-5.6 Sol rises like the sun,
  and GPT-6 Sol crosses the sky like the sun over a sundial. The scenes play by themselves, taking turns, and wait while
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

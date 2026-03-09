# CIP local diagnostic (test_graphix → stitched GIF)

Open this in a browser to generate a **single offline diagnostic GIF** using only local assets:

- Inputs: `img/test_graphix/b1.png`, `b2.png`, `b3.png`
- Output: One GIF (download link)
- Sequence: `mask → m2i(b1) → b1 → i2m(b1) → mask → ... → b3 → i2m(b3) → mask`

## Run

From the `json-builder-app` folder:

- `python -m http.server`
- Open: `http://localhost:8000/tools/cip_test_graphix_gif.html`

## Notes

- This uses an in-browser GIF encoder via CDN (`gifenc`). If you need it fully offline, tell me and I’ll vendor a local copy.
- The shared mask is computed as **pixel-wise average** of the three images, then modified for visibility as: average + noise + block-shuffle.
- The transition generator is a blockwise shuffle+morph (same conceptual model as the CIP sprite generator), but runs entirely locally on the CPU for diagnostics.

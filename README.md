# Ceph Config Diff Viewer

This folder contains a static website for browsing pre-generated Ceph config diffs.

## Files

- `index.html`: UI shell
- `styles.css`: page styling
- `app.js`: data loading and rendering logic
- `data/*.json`: static diff payloads generated from `config_diff.py diff-branch`

## Run locally

From this directory, start any static file server. For example:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

## Deploy (GitHub Pages)

This site is ready for automatic deployment to GitHub Pages using the included workflow:

- `.github/workflows/deploy-pages.yml`

### One-time setup

1. Create a GitHub repository and push this folder.
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.

After that, every push to `main` will publish the site.

## Data source

The JSON files were generated from `src/script/config-diff/config_diff.py` using branch pairs across:

- Reference versions: `main`, `tentacle`, `squid`
- Comparing versions: `tentacle`, `squid`, `reef`

# Screenshots

Screenshots for the README and documentation live in `public/screenshots/`.

## Status

Screenshots have not been added to the repository yet. They need to be taken from the running app.

## How to contribute screenshots

1. Run the app locally (`npm run dev`)
2. Configure a MiniMax API key (or enable Demo Mode)
3. Navigate to each page
4. Take a screenshot at 1280×800 resolution (or similar)
5. Save to `public/screenshots/` with the filename listed below
6. Open a pull request

## Desired screenshots

| Filename | Page | Notes |
|---|---|---|
| `dashboard-light.png` | Home / dashboard overview | Light theme |
| `dashboard-dark.png` | Home / dashboard overview | Dark theme |
| `script-generator.png` | Scripts page | Show a generated script |
| `thumbnail-generator.png` | Thumbnails page | Show generated thumbnails |
| `music-generator.png` | Music page | Show the music player |
| `pipeline-builder.png` | Pipeline page | Show a running pipeline |
| `assets-library.png` | Assets page | Show asset grid |
| `settings-api-key.png` | Settings page | Show settings form (no real key visible) |
| `exports-page.png` | Exports page | Show export records |

## Guidelines for screenshots

- Use example/demo content — do not show real API keys or personal data
- Prefer clean, minimal state (not cluttered with errors)
- If dark and light modes exist, include both for the main views
- 16:9 ratio preferred (e.g., 1280×720 or 1440×810)
- PNG format

## Adding screenshots to the README

Once screenshots are in `public/screenshots/`, update [README.md](../README.md):

```markdown
## Preview

![Dashboard](public/screenshots/dashboard-light.png)

![Script Generator](public/screenshots/script-generator.png)

![Thumbnail Generator](public/screenshots/thumbnail-generator.png)
```

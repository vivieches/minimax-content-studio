# MiniMax Content Studio

> Open-source creative dashboard for creators using MiniMax API.

Generate scripts, thumbnails, music and content assets — all from one clean local interface.

**Early preview:** this project is still evolving. Contributions are welcome.

---

## What is this?

MiniMax Content Studio is an experimental open-source dashboard for creators, builders and AI enthusiasts who want a visual workflow on top of MiniMax's models and APIs.

You bring your own MiniMax API key. Everything runs locally on your machine.

**It is designed to help with:**

- Video script generation (MiniMax M2.7)
- YouTube thumbnail generation (MiniMax Image)
- Music generation (MiniMax Music)
- Multi-step content pipelines
- Asset library and export management
- Settings and API key configuration

---

## Preview

> Screenshots coming soon. See [docs/screenshots.md](docs/screenshots.md) for the list of planned screenshots.
>
> To contribute screenshots, run the app locally and open a PR with images in `public/screenshots/`.

---

## Features

| Feature | Status |
|---|---|
| Script Generator | ✅ Working |
| Thumbnail Generator | ✅ Working |
| Music Generator | ✅ Working |
| Pipeline Builder | ✅ Working |
| Assets Library | ✅ Working |
| Exports Manager | ✅ Working |
| Settings + API Key config | ✅ Working |
| Demo Mode (no API key) | ✅ Working |
| Video Generator | 🚧 Adapter ready, API endpoint pending |
| SQLite storage | 🗓️ Planned |
| Background jobs / WebSocket | 🗓️ Planned |
| Export .zip packages | 🗓️ Planned |

---

## Requirements

- **Node.js 18+** (20 recommended)
- **npm** (included with Node.js)
- **MiniMax API key** — get one at [minimax.io](https://minimax.io)

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/vivimvivim/minimax-content-studio.git
cd minimax-content-studio

# 2. Install dependencies
npm install

# 3. Configure your API key
cp .env.example .env.local
# Edit .env.local and add your MINIMAX_API_KEY

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuring your MiniMax API Key

### Option A — `.env.local` file (recommended)

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
MINIMAX_API_KEY=your_real_key_here
MINIMAX_API_KEY_TYPE=pay_as_you_go
```

### Option B — Settings page in the app

1. Open the app at `http://localhost:3000`
2. Go to **Settings** in the sidebar
3. Enter your API key
4. Click **Test Connection** to verify
5. Click **Save Settings**

> **Note:** Your API key stays on your local machine only. It is never sent anywhere except directly to MiniMax servers.

---

## How to use

### Script Generator

Go to **Scripts** → describe your video idea → configure tone, audience, language, duration → click **Generate Script**. Copy, download as `.md`, or export as `.json`.

### Thumbnail Generator

Go to **Thumbnails** → enter theme and title → generate an AI prompt or write your own → click **Generate Thumbnails** → download or favorite.

### Music Generator

Go to **Music** → select mood, genre, tempo → click **Generate Music** → play in the built-in player → download MP3.

### Pipeline Builder

Go to **Pipeline** → enter your project briefing → select which steps to run (script, thumbnail, music, video) → click **Run Pipeline** → watch each step complete.

### Assets

All generated content is automatically saved. Filter by type, search, favorite, download, or delete.

### Exports

Pipeline outputs create export records. Download metadata and files, track status.

---

## Demo Mode

To test the UI without an API key:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Demo mode uses mock data and does not call the MiniMax API.

---

## Project structure

```
app/
  (dashboard)/        # Dashboard pages (scripts, thumbnails, music, etc.)
  api/                # Next.js API routes (backend)
components/           # Shared UI components
lib/
  minimax/            # MiniMax API clients (text, image, music, video)
  storage/            # Local JSON storage (settings, assets, exports)
  prompts/            # Prompt templates
  security/           # Input validation and sanitization
  validation/         # Zod schemas
data/                 # Local storage (git-ignored, created on first run)
public/               # Static assets
docs/                 # Documentation
```

---

## Available scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests (Playwright)
```

---

## Known limitations

- **Video generation:** MiniMax Video/Hailuo API integration is adapter-ready but depends on MiniMax's official video endpoint. It may not work yet depending on your account.
- **Async jobs:** Music and video use synchronous polling. Full async with WebSocket updates is planned.
- **Storage:** Uses JSON files for MVP. SQLite support is planned.
- **This is an early preview.** Some edges may be rough. Bug reports and PRs are welcome.

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full roadmap.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

Good areas to help:
- UI polish and responsiveness
- MiniMax API integrations (especially video)
- Thumbnail generator improvements
- Tests and documentation
- Bug fixes
- Design improvements

---

## Security

- Your API key is **never** committed to git (`.env.local` is git-ignored)
- All generation happens server-side via Next.js API routes
- No external telemetry or tracking

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

---

## Documentation

| Doc | Description |
|---|---|
| [docs/setup.md](docs/setup.md) | Detailed setup guide |
| [docs/minimax-api.md](docs/minimax-api.md) | MiniMax API configuration |
| [docs/roadmap.md](docs/roadmap.md) | Project roadmap |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common issues |
| [docs/screenshots.md](docs/screenshots.md) | Screenshot guide |

---

## License

[MIT](LICENSE) — 2026 MiniMax Studio Contributors

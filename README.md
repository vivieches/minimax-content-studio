<div align="center">

# Open Studio

**From idea to upload-ready content.**

[![License MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-6366f1?style=flat-square)](CONTRIBUTING.md)
[![Early Preview](https://img.shields.io/badge/status-early%20preview-f59e0b?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)

Open Studio is an open-source creator workspace for generating and organizing scripts, thumbnails, captions, descriptions, hashtags and creative assets in one place.

</div>

---

> **Early preview.** This project is still evolving. Contributions are welcome.

---

## What is Open Studio?

Open Studio is a local dashboard for creators who want to go from a raw idea to fully publish-ready content — without switching between five different tools.

You bring an idea. Open Studio helps turn it into everything you need to publish.

**Built for:** YouTubers, TikTokers, social media managers, small agencies and anyone creating content with AI.

---

## What you can create

| Output | Description |
|---|---|
| 🎬 **Script** | Video scripts structured for YouTube, TikTok, Reels |
| 🖼️ **Thumbnail** | AI-generated thumbnail concepts |
| 💬 **Captions** | Subtitles and short-form captions |
| 📝 **Description** | Platform-ready video descriptions |
| # **Hashtags & Tags** | Optimized hashtag sets per platform |
| 💡 **Post ideas** | Content ideas from a single topic |
| 🎨 **Creative assets** | Visual assets for posts and stories |
| 🎵 **Music / jingles** | Simple background music (where supported) |
| 📦 **Exports** | Organized export of all generated assets |
| ⚡ **Full pipelines** | idea → script → thumbnail → description → hashtags → export |

---

## How it works

```
1. Download Open Studio from GitHub
2. Install dependencies
3. Add your API key from your chosen provider
4. Open the dashboard
5. Start from an idea or pick what you want to create
6. Generate script, thumbnail, description, hashtags and more
7. Organize everything in assets and export
```

---

## Multi-provider architecture

Open Studio is built to work with multiple AI providers. You connect your own API key and choose which provider to use for each type of content.

**First supported provider:** MiniMax

**Planned provider types:**
- Text / script generation
- Image generation
- Video generation
- Audio / music generation
- Voice synthesis
- Multimodal models

> Open Studio is not affiliated with MiniMax.
> MiniMax is one supported integration among others.
> Users need their own API key from their chosen provider.

---

## Quick Start

### Requirements

- **Node.js 18+** (20 recommended)
- **npm** (included with Node.js)
- **API key** from a supported provider (e.g. MiniMax at [minimax.io](https://minimax.io))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/vivieches/minimax-content-studio.git
cd minimax-content-studio

# 2. Install dependencies
npm install

# 3. Configure your API key
cp .env.example .env.local
# Edit .env.local and add your API key

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Mode

Try the full UI without any API key:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

---

## Feature Status

| Feature | Status |
|---|---|
| Script Generator | ✅ Working |
| Thumbnail Generator | ✅ Working |
| Music Generator | ✅ Working |
| Pipeline Builder | ✅ Working |
| Assets Library | ✅ Working |
| Exports Manager | ✅ Working |
| Settings + API Key config | ✅ Working |
| Demo Mode | ✅ Working |
| Captions / Descriptions / Hashtags | 🚧 In progress |
| Multi-provider support | 🚧 In progress |
| Video Generator | 🚧 Adapter ready, API endpoint pending |
| SQLite storage | 🗓️ Planned |
| Background jobs / WebSocket | 🗓️ Planned |
| Export .zip packages | 🗓️ Planned |

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run end-to-end tests (Playwright)
```

---

## Project Structure

```
app/
  (dashboard)/        # Dashboard pages (scripts, thumbnails, music, etc.)
  api/                # Next.js API routes (backend)
components/           # Shared UI components
lib/
  providers/          # AI provider clients (MiniMax and future providers)
  storage/            # Local JSON storage (settings, assets, exports)
  prompts/            # Prompt templates
  security/           # Input validation and sanitization
  validation/         # Zod schemas
data/                 # Local storage (git-ignored, created on first run)
public/               # Static assets
docs/                 # Documentation
```

---

## Contributing

Open Studio is built to grow with the community.

**Good areas to contribute:**
- New AI provider integrations
- New content types (captions, hashtags, descriptions)
- UI improvements and dark mode polish
- Tests and documentation
- Bug fixes

See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.
For bugs and ideas, [open an issue](https://github.com/vivieches/minimax-content-studio/issues).

---

## Security

- API keys are **never** committed to git (`.env.local` is git-ignored)
- All generation happens server-side via Next.js API routes
- No external telemetry or tracking

See [SECURITY.md](SECURITY.md) to report vulnerabilities.

---

## Documentation

| Doc | Description |
|---|---|
| [docs/setup.md](docs/setup.md) | Detailed setup guide |
| [docs/providers.md](docs/providers.md) | Supported providers and configuration |
| [docs/roadmap.md](docs/roadmap.md) | Project roadmap |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common issues |

---

## License

[MIT](LICENSE) — Built by [Vitoria Ferreira](https://github.com/vivieches)
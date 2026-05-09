# Contributing to MiniMax Content Studio

Thanks for wanting to contribute. This is an early-stage open-source project and all help is welcome.

## Good areas to contribute

- **UI polish** — better layout, responsiveness, dark/light mode improvements
- **MiniMax API integrations** — especially video generation when the endpoint is available
- **Thumbnail generator** — better prompts, reference image support, text overlay
- **Script generator** — more tones, languages, output formats
- **Music generator** — more controls, audio player improvements
- **Pipeline builder** — more steps, better error handling
- **Tests** — unit tests (Vitest), e2e tests (Playwright)
- **Documentation** — setup guides, API docs, tutorials
- **Bug fixes** — check open issues
- **Design improvements** — consistency, accessibility, UX
- **Asset/export workflows** — .zip export, persistent history

## How to contribute

1. **Fork the repo** and clone it locally
2. **Create a branch** for your change (`git checkout -b feat/my-feature`)
3. **Make your changes** following the guidelines below
4. **Run checks** before pushing:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
5. **Open a pull request** — describe what changed and why

## Guidelines

- **Keep the UI clean and minimal.** Prefer simple over clever.
- **Do not commit API keys.** Never put a real key in any file. Use `.env.local` (git-ignored).
- **Do not add mock data as if it were a real feature.** If something is not implemented, say so clearly.
- **Document new environment variables.** Add them to `.env.example` and `docs/minimax-api.md`.
- **Prefer small PRs.** One thing per PR is easier to review.
- **Explain what changed.** PR descriptions don't need to be long, but they should say why.
- **Follow the existing code style.** ESLint is configured — run `npm run lint` before pushing.
- **TypeScript only.** No plain `.js` files in `app/`, `components/`, or `lib/`.

## Local setup

See [docs/setup.md](docs/setup.md) for full setup instructions.

Quick start:

```bash
git clone https://github.com/your-fork/minimax-content-studio.git
cd minimax-content-studio
npm install
cp .env.example .env.local
# Edit .env.local with your MiniMax API key
npm run dev
```

## Reporting bugs

Open a GitHub issue using the **Bug Report** template. Include:
- Steps to reproduce
- What you expected vs what happened
- Your OS, browser, and Node.js version
- Relevant error messages (without API keys or secrets)

## Requesting features

Open a GitHub issue using the **Feature Request** template. Describe the problem you want to solve, not just the solution you have in mind.

## Questions

Feel free to open a GitHub Discussion or an issue tagged `question`.

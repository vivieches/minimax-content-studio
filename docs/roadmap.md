# Roadmap

MiniMax Content Studio is an early-preview project. This roadmap reflects current plans — priorities may shift based on community feedback and MiniMax API availability.

---

## Phase 1 — Public open-source release ✅

- [x] Script Generator (MiniMax M2.7)
- [x] Thumbnail Generator (MiniMax Image)
- [x] Music Generator (MiniMax Music)
- [x] Pipeline Builder (multi-step workflows)
- [x] Assets Library
- [x] Exports Manager
- [x] Settings with Test Connection
- [x] Demo Mode (no API key needed)
- [x] README, LICENSE, CONTRIBUTING, SECURITY
- [x] .env.example and git-ignored secrets
- [x] CI workflow (lint + typecheck + build)
- [x] GitHub repository published

---

## Phase 2 — Better thumbnail workflow 🚧

- [ ] Reference image upload (face/style reference)
- [ ] Better YouTube prompt builder (title, A/B variations)
- [ ] Stable text overlay (position, font size, color)
- [ ] 1280×720 guaranteed export
- [ ] Variations panel (generate 2–4 options side by side)
- [ ] Favorite and compare thumbnails

---

## Phase 3 — Better assets and exports 🗓️

- [ ] Persistent download history across sessions
- [ ] Asset tagging and search improvements
- [ ] Export .zip packages (script + thumbnail + music)
- [ ] Asset preview modal
- [ ] Bulk delete and bulk download

---

## Phase 4 — More MiniMax tools 🗓️

- [ ] Video generator (when MiniMax Video endpoint is available)
- [ ] Audio/voiceover from script
- [ ] T2A (text-to-audio) integration
- [ ] Video workflow: script → voiceover → video
- [ ] Pipeline templates (quick-start for common content types)

---

## Phase 5 — Infrastructure improvements 🗓️

- [ ] SQLite storage backend (replace JSON files)
- [ ] Background job processing with WebSocket updates
- [ ] Job queue for long-running generations
- [ ] Better error recovery and retry logic

---

## Phase 6 — Community and DX 🗓️

- [ ] Multi-language UI
- [ ] Batch processing (generate multiple assets at once)
- [ ] Plugin/extension system
- [ ] Better test coverage (unit + e2e)
- [ ] Storybook for UI components
- [ ] Detailed API client documentation

---

## Contributing to the roadmap

Have a feature you'd like to see? Open a [GitHub Issue](https://github.com/vivimvivim/minimax-content-studio/issues) with the `enhancement` label.

Have time to implement something? Check [CONTRIBUTING.md](../CONTRIBUTING.md) and open a PR.

# Changelog

All notable changes to Open Studio will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Video generator (MiniMax Video/Hailuo endpoint)
- SQLite storage backend
- Background job processing with WebSocket updates
- Export .zip packages
- Template-based quick start
- Multi-language UI
- Batch processing

---

## [0.1.0] — 2026-05-09

Initial open-source release.

### Added
- Script Generator using the configured text provider
- Thumbnail Generator using configured image provider (image-01)
- Music Generator using configured music provider (music-2.6)
- Pipeline Builder (multi-step: script → thumbnail → music → video)
- Assets Library (save, filter, search, favorite, download, delete)
- Exports Manager (download metadata and files)
- Settings page with API key configuration and Test Connection
- Demo Mode (mock data, no API key required)
- Three provider modes: `official-text-v2`, `openai-compatible`, `anthropic-compatible`
- Local JSON storage for settings, assets, and exports
- Text overlay editor for thumbnails
- CI workflow (lint + typecheck + build)
- MIT License
- Open-source community files (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)

### Known limitations
- Video generation adapter is ready but API endpoint not yet available
- Storage uses JSON files (SQLite planned)
- Async job support not yet implemented

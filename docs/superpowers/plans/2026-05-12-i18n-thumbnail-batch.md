# i18n Thumbnail Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add global generation locale and real thumbnail batch generation without redesigning Open Studio.

**Architecture:** Use one shared locale module as the source of truth for UI, settings and generation contracts. Keep image prompts technical in English, but force visible image text into the selected locale. Add real thumbnail batch generation after the locale foundation is stable.

**Tech Stack:** Next.js App Router, TypeScript, Zod, local storage settings, existing provider adapters, existing generated image cache and assets store.

---

## Files

- Create: `lib/locales.ts`
- Modify: `lib/i18n.tsx`
- Modify: `app/components/LanguageSwitcher.tsx`
- Modify: `lib/storage/settings.ts`
- Modify: `lib/validation/schemas.ts`
- Modify: `lib/providers/types.ts`
- Modify: `lib/providers/generation.ts`
- Modify: `lib/prompts/scriptPrompt.ts`
- Modify: `lib/prompts/thumbnailPrompt.ts`
- Later Sprint 2 create: `app/api/generate/thumbnails/route.ts`
- Later Sprint 3 modify: `app/(dashboard)/thumbnails/page.tsx`
- Later Sprint 4 modify: `app/api/generate/package/route.ts`, `lib/providers/generation.ts`

## Sprint 1 - Locale Foundation

- [x] Create `lib/locales.ts` with canonical locale types and prompt instructions.
- [x] Change `AppSettings.language` to canonical `Locale`.
- [x] Make settings migration normalize old values.
- [x] Change `settingsSchema.language` to accept canonical locales and old values.
- [x] Change `lib/i18n.tsx` to use `en-US`, `pt-BR`, `es-ES`.
- [x] Make `LanguageSwitcher` sync the selected locale to `/api/settings`.
- [x] Add `locale` to text/image provider request types.
- [x] Add locale instruction to text generation centrally.
- [x] Add image-visible-text locale rule centrally.
- [x] Update script and thumbnail prompt helpers to use the shared locale helpers.
- [x] Run only quick structural validation if needed; defer full tests to Sprint 5. `rtk npm run typecheck` passed.

## Sprint 2 - Thumbnail Batch API

- [ ] Add `thumbnailBatchGenerateSchema`.
- [ ] Create `POST /api/generate/thumbnails`.
- [ ] Reuse `generateImageWithProvider` and `cacheGeneratedImageUrls`.
- [ ] Generate 1-10 real images.
- [ ] Save every generated image as a thumbnail asset.
- [ ] Return `thumbnails[]` with URL, prompt, visible text, locale, provider and model.

## Sprint 3 - Thumbnail UI

- [ ] Replace "prompt-first" mental model with "real image batch".
- [ ] Add quantity selector with values `1`, `2`, `3`, `4`, `5`, `8`, `10`.
- [ ] Send selected locale and quantity to `/api/generate/thumbnails`.
- [ ] Render all returned images.
- [ ] Keep technical prompt collapsed/debug-only.

## Sprint 4 - Pipeline Integration

- [ ] Add thumbnail quantity to pipeline state.
- [ ] Use batch thumbnail API inside package flow.
- [ ] Persist thumbnail batch in project package metadata.
- [ ] Include locale and thumbnails in export payload.

## Sprint 5 - Final Verification

- [ ] Run `rtk npm run lint`.
- [ ] Run `rtk npm run typecheck`.
- [ ] Run `rtk npm test`.
- [ ] Run `rtk npm run build`.
- [ ] Run `rtk npm run test:e2e`.
- [ ] Manual smoke PT/ES/EN.
- [ ] Manual smoke thumbnail quantities 1/3/10.

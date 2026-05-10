# Provider Architecture

Open Studio is a local BYOK app. API keys stay in `.env.local` or in the local settings file, and route responses must never expose key values.

## Runtime Flow

1. Provider manifests live in `lib/providers/manifests.ts`.
2. User/default settings are resolved in `lib/storage/settings.ts`.
3. `lib/providers/runtime.ts` chooses the provider and model for each capability.
4. `lib/providers/registry.ts` maps provider IDs to adapters.
5. `lib/providers/generation.ts` exposes provider-agnostic generation functions.
6. API routes call the generation functions, not provider-specific fetch code.

Legacy MiniMax facade files still exist for old UI routes, but they delegate to the centralized MiniMax implementation so Settings, Demo Mode, base URLs, and model overrides are respected.

## Supported Capabilities

| Provider | Text | Image | Audio | Video | Notes |
| --- | --- | --- | --- | --- | --- |
| MiniMax | Yes | Yes | Yes | Yes | Native integration and default provider. |
| OpenAI Compatible | Yes | Yes | No | No | Generic `/v1` API shape. |
| OpenRouter | Yes | No | No | No | Uses OpenAI-compatible adapter. |
| Groq | Yes | No | No | No | Uses OpenAI-compatible adapter. |
| Together AI | Yes | Yes | No | No | Uses OpenAI-compatible adapter. |
| Anthropic | Yes | No | No | No | Native Messages API shape. |
| Gemini | Yes | No | No | No | Native `generateContent` shape. |
| fal.ai | No | Yes | No | Yes | Queue-style media endpoints. |
| Replicate | No | Yes | No | Yes | Prediction endpoints. |
| ElevenLabs | No | No | Yes | No | Text-to-speech only. |

## Testing Without API Keys

Use three layers:

1. Unit/contract tests: `npm test -- lib/providers`
   - Mocks `fetch`.
   - Verifies URL, method, auth header, body payload, and response parsing.
   - Does not need internet or real keys.
2. Demo Mode: set `NEXT_PUBLIC_DEMO_MODE=true`.
   - Exercises the app flow without provider calls.
   - Useful for UI and local workflow checks.
3. Real-key smoke test, only when a key is available:
   - Add one provider key in Settings or `.env.local`.
   - Use Settings -> Test Connection.
   - Generate one small text/image/audio sample with `saveToAssets=false` where possible.
   - Confirm no API key appears in the browser response, console, or saved asset metadata.

## Environment Variables

`.env.example` lists the supported provider key and base URL variables. For non-MiniMax providers, model selection is currently stored through Settings rather than model-specific env vars.

## Manual Review Checklist

- New providers must add a manifest, adapter, registry entry, env key mapping, and contract tests.
- Adapters must call `requireApiKey` before `fetch`.
- Adapters must use `readError` for non-OK responses and avoid logging secrets.
- API routes should accept provider overrides through validation schemas.
- Demo Mode should return useful mock outputs and make no network requests.

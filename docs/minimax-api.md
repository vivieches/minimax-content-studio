# MiniMax API Configuration

## Getting your API key

1. Go to [minimax.io](https://minimax.io) and create an account
2. Navigate to the API section of your dashboard
3. Generate a new API key
4. Copy the key — it starts with `sk-cp-...`

## Setting up your key

Copy `.env.example` to `.env.local` and fill in your key:

```bash
cp .env.example .env.local
```

```env
MINIMAX_API_KEY=sk-cp-your_real_key_here
MINIMAX_API_KEY_TYPE=pay_as_you_go
```

**Never commit `.env.local` to git.** It is already in `.gitignore`.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MINIMAX_API_KEY` | Yes | — | Your MiniMax API key |
| `MINIMAX_API_KEY_TYPE` | No | `pay_as_you_go` | Key type: `pay_as_you_go` or `token_plan` |
| `MINIMAX_BASE_URL` | No | `https://api.minimax.io` | API base URL |
| `MINIMAX_TEXT_MODEL` | No | `MiniMax-M2.7` | Model for script generation |
| `MINIMAX_TEXT_MODEL_FAST` | No | `MiniMax-M2.7-highspeed` | Faster model for quick tasks |
| `MINIMAX_IMAGE_MODEL` | No | `image-01` | Model for thumbnail generation |
| `MINIMAX_MUSIC_MODEL` | No | `music-2.6` | Model for music generation |
| `MINIMAX_VIDEO_MODEL` | No | — | Model for video generation (optional) |
| `MINIMAX_PROVIDER_MODE` | No | `official-text-v2` | API format (see below) |
| `MINIMAX_DEBUG_MODE` | No | `false` | Enable detailed API logs |
| `NEXT_PUBLIC_DEMO_MODE` | No | `false` | Use mock data, skip API calls |
| `LOCAL_STORAGE_DRIVER` | No | `json` | Storage backend (`json`) |

## Provider modes

The app supports three API formats:

| Mode | Description |
|---|---|
| `official-text-v2` | MiniMax chatcompletion_v2 endpoint (default, recommended) |
| `openai-compatible` | OpenAI-compatible API format |
| `anthropic-compatible` | Anthropic-compatible API format |

Configure in `.env.local` or via the Settings page.

## Which tools use the API

| Feature | API Used | Notes |
|---|---|---|
| Script Generator | Text (M2.7) | chatcompletion endpoint |
| Thumbnail Generator | Image (image-01) | image generation endpoint |
| Music Generator | Music (music-2.6) | music generation endpoint |
| Video Generator | Video (adapter ready) | endpoint not yet available |
| Pipeline Builder | All of the above | runs them in sequence |
| Test Connection | Text | minimal request to verify key |

## API costs

MiniMax API calls are billed to your account based on usage:
- Text: per token
- Image: per image
- Music: per generation
- Video: per second of video (when available)

Check your MiniMax dashboard for current pricing.

## Common errors

### `MINIMAX_API_KEY is not set`

You have not configured your API key. Set it in `.env.local` or via the Settings page.

### `Invalid API key`

Your key is incorrect or has been revoked. Check the MiniMax dashboard and generate a new one if needed.

### `Rate limit exceeded`

You've hit your plan's rate limit. Wait a few seconds and try again, or upgrade your plan.

### `Generation timeout`

Music and video generation can take 30–120 seconds. The app polls for completion. If it times out, check the MiniMax dashboard for the status of the job.

### `Image URL expired`

MiniMax image URLs are temporary (expire in ~24h). Download images you want to keep.

## Security note

- Your API key is stored locally in `data/settings.json` (git-ignored)
- It is sent only to MiniMax API endpoints
- It is never logged in production mode
- Never share your key publicly
- Revoke and regenerate immediately if exposed

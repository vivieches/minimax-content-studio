# Setup Guide

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 18+ (20 recommended) |
| npm | Included with Node.js |
| MiniMax API Key | Required for generation features |

## Step-by-step installation

### 1. Clone the repository

```bash
git clone https://github.com/vivimvivim/minimax-content-studio.git
cd minimax-content-studio
```

### 2. Install dependencies

```bash
npm install
```

This will install all required packages. It may take a minute.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
# Required
MINIMAX_API_KEY=your_real_key_here

# Key type: pay_as_you_go or token_plan
MINIMAX_API_KEY_TYPE=pay_as_you_go

# Optional — defaults are usually fine
MINIMAX_BASE_URL=https://api.minimax.io
MINIMAX_TEXT_MODEL=MiniMax-M2.7
MINIMAX_IMAGE_MODEL=image-01
MINIMAX_MUSIC_MODEL=music-2.6
```

See [minimax-api.md](minimax-api.md) for details on each variable.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Configure your API key in the app

If you prefer not to use `.env.local`:

1. Go to **Settings** in the sidebar
2. Enter your MiniMax API key
3. Click **Test Connection** to verify
4. Click **Save Settings**

---

## Running in Demo Mode

No API key? You can still explore the UI:

```bash
# In .env.local
NEXT_PUBLIC_DEMO_MODE=true
```

Demo mode uses mock data. No real API calls are made.

---

## Building for production

```bash
npm run build
npm run start
```

---

## Running tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests (requires app running)
npm run test:e2e
```

---

## Where data is stored

All generated content, settings, and assets are stored in the `/data` directory:

```
data/
  settings.json   # API key and preferences
  assets.json     # All generated assets (scripts, thumbnails, music)
  exports.json    # Pipeline exports
  files/          # Downloaded binary files (images, audio)
    thumbnails/
    music/
    scripts/
    video/
```

This directory is **git-ignored**. Your data stays on your machine.

---

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for common issues.

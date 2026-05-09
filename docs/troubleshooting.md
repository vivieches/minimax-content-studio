# Troubleshooting

## App does not start

**Symptom:** `npm run dev` fails immediately.

**Check:**

1. Node.js version — requires 18+:
   ```bash
   node --version
   ```
2. Dependencies installed:
   ```bash
   npm install
   ```
3. Port 3000 in use — try a different port:
   ```bash
   npm run dev -- -p 3001
   ```
4. TypeScript errors blocking startup — run:
   ```bash
   npx tsc --noEmit
   ```

---

## Missing API key error

**Symptom:** The app shows "API key not configured" or generation fails immediately.

**Fix:**

1. Check that `.env.local` exists:
   ```bash
   ls .env.local
   ```
2. If it doesn't exist, create it:
   ```bash
   cp .env.example .env.local
   ```
3. Add your key to `.env.local`:
   ```env
   MINIMAX_API_KEY=sk-cp-your_real_key_here
   ```
4. Restart the dev server after editing `.env.local`.

Alternatively, configure the key via **Settings** in the app (no restart needed).

---

## Invalid API key

**Symptom:** Test Connection fails with "Invalid key" or 401 error.

**Fix:**

1. Verify the key in your [MiniMax dashboard](https://minimax.io)
2. Check that you copied the full key — it starts with `sk-cp-`
3. Make sure the key type matches: `pay_as_you_go` or `token_plan`
4. Try generating a new key if the existing one is revoked

---

## Generation fails

**Symptom:** Clicking "Generate" shows an error or nothing happens.

**Check:**

1. Is the API key set and valid? Go to Settings → Test Connection
2. Is the MiniMax service up? Check [minimax.io](https://minimax.io)
3. Have you hit your rate limit? Wait a few seconds and retry
4. Check browser console for error details
5. Enable debug mode for detailed logs:
   ```env
   MINIMAX_DEBUG_MODE=true
   ```
   Then check the terminal where `npm run dev` is running.

---

## Image or thumbnail does not load

**Symptom:** Generated thumbnail shows a broken image.

**Likely causes:**

- MiniMax image URLs are **temporary** (expire in ~24 hours). Download images you want to keep.
- Network issue or CDN timeout — retry the generation
- Generation failed silently — check the Assets page for the actual status

---

## Music does not play

**Symptom:** Music generator says it succeeded but the audio player shows nothing.

**Check:**

1. Music files are downloaded to `data/files/music/` — check if the file exists
2. Browser may block autoplay — click the play button manually
3. If the file is 0 bytes, the generation or download failed — try generating again
4. Check terminal for download errors with `MINIMAX_DEBUG_MODE=true`

---

## Build errors

**Symptom:** `npm run build` fails.

**Common fixes:**

1. Run `npm install` to ensure all dependencies are installed
2. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```
3. Check ESLint errors:
   ```bash
   npm run lint
   ```
4. Ensure Node.js 18+ is installed

---

## Dependency issues

**Symptom:** `npm install` fails or produces errors.

**Fix:**

1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check your Node.js version — requires 18+
3. If on Windows and getting permission errors, run your terminal as Administrator

---

## Data directory issues

**Symptom:** "Cannot read settings" or storage errors on startup.

**Fix:**

The `data/` directory and its JSON files are created automatically on first run. If they get corrupted:

```bash
rm -rf data/
npm run dev
```

This resets all local data (settings, assets, exports). Your `.env.local` is not affected.

---

## Still stuck?

Open a [GitHub Issue](https://github.com/vivimvivim/minimax-content-studio/issues) with:
- Your OS and Node.js version
- The error message (without API keys)
- Steps to reproduce

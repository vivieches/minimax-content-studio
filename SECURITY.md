# Security Policy

## This is an early-preview project

Open Studio is an experimental open-source dashboard. It is not a production SaaS service. All generation runs locally on your machine using your own API key.

## API Key Safety

**Your MiniMax API key is sensitive. Protect it.**

- Never commit your `.env.local` file to git — it is already listed in `.gitignore`
- Never paste your API key in GitHub issues, pull requests, or comments
- If you accidentally expose your key, revoke it immediately at [minimax.io](https://minimax.io) and generate a new one
- The app stores your key locally in `data/settings.json` — this folder is also git-ignored

## What this app does with your key

- Sends it only to MiniMax API endpoints (configured in `.env.local`)
- Never logs it to the console in production mode
- Never sends it to any other server

## Supported versions

This project is in early preview. Only the latest version on `main` is supported.

## Reporting a vulnerability

**Do not report security vulnerabilities in public GitHub issues.**

If you find a security issue (e.g., API key leak in logs, insecure storage, request hijacking), please:

1. Open a **private** GitHub Security Advisory (via the Security tab of the repo)
2. Or email the maintainer directly if a private advisory is not available

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix, if you have one

We will respond as quickly as possible. For an early-preview project, please be patient.

## Out of scope

The following are **not** considered security vulnerabilities for this project:

- Missing HTTPS (this is a local development tool, not a hosted service)
- Rate limiting (you control your own API key usage)
- Issues only reproducible by someone with physical access to your machine

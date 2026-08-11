# J.ALI Billing

A lightweight Progressive Web App for generating and managing invoices for J.Ali Electronics & Electricals.

## Overview

`J.ALI Billing` is a front-end billing solution built with HTML, CSS, and JavaScript. It includes a PWA manifest and service worker for offline-friendly loading and asset caching.

## Features

- Invoice generation with company branding
- Configurable company details via `config.json`
- Dark/light theme support
- PWA-ready with `manifest.json`
- Asset caching via `service-worker.js`
- Supports logo, watermark, signature, and QR scanner assets

## Project Structure

- `index.html` — main application UI
- `config.json` — company, theme, invoice, and display settings
- `manifest.json` — PWA metadata
- `service-worker.js` — caching and offline behavior
- `assets/` — app icons, logo images, and signature

## Usage

1. Open `index.html` in a browser.
2. Use the invoice form to add billing details.
3. Generate or download invoices as needed.

## Notes

- The service worker caches static images and serves the app shell offline.
- `config.json` is loaded over the network and is not cached by the service worker.
- Asset file paths are configured in `config.json` and referenced from the app.

## License

This repository does not include a license file. Add one if you want to make the project open source.

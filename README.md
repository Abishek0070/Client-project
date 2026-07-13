# Sivalayas Travels — Receipt App

A tiny, no-login web app that reproduces your paper receipt exactly. Fill it in on your phone, tap **Download PDF**, and share it — or tap **Share** to send straight to WhatsApp/Email.

## What's inside
- `index.html` — the receipt form (looks like your printed template)
- `app.js` — logic: auto S. No, saves your draft on the device, builds the PDF, share
- `manifest.json`, `sw.js`, `icon.svg` — makes it installable as a mobile "app" (PWA)

## Try it right now (no setup)
Open `index.html` directly in a phone or desktop browser — the form and PDF download work immediately. (The "Add to Home Screen" install and offline mode need it hosted on a real web address with HTTPS — see below.)

## Put it on your phone as an app (free, ~2 minutes)
The easiest free host is **Netlify Drop**:
1. Go to https://app.netlify.com/drop on a computer
2. Drag this whole folder onto the page
3. You'll get a free link like `https://your-site.netlify.app`
4. Open that link on your phone → browser menu → **"Add to Home Screen"**

It'll now sit on your home screen with its own icon and open full-screen like a normal app.

(Alternatives that work the same way: GitHub Pages, Vercel, Cloudflare Pages — any static host works, since this app has no backend/server.)

## How it works
- **S. No** increases automatically each time you tap "+ New Bill" or Download — no two bills share a number.
- **Date** defaults to today; edit if needed.
- Everything you type is saved on your device automatically (so refreshing or closing the tab won't lose your in-progress bill).
- **Total KM** and **Total Amount** are typed in manually, not calculated for you (as requested).
- Nothing is uploaded anywhere — all data stays on the phone/browser being used.

## Customizing
- Company name/address/phone are fixed text in `index.html` inside the `<div class="company">` block — edit there if the details ever change.
- Colors/layout live in the `<style>` block at the top of `index.html`.
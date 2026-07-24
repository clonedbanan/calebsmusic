# Caleb's Music of the Week — live Netlify edition

This version stores the song queue in **Netlify Blobs**, so Admin changes are shared across browsers and devices.

## Deploy to the existing Netlify project

The recommended route is a GitHub repository because Netlify Functions need a build/deploy step.

1. Create a new GitHub repository.
2. Upload every file and folder in this project, preserving `netlify/functions/`.
3. In the existing Netlify project, connect the GitHub repository under continuous deployment.
4. Use these build settings:
   - Build command: leave blank
   - Publish directory: `.`
   - Functions directory: `netlify/functions` (also set by `netlify.toml`)
5. In **Project configuration → Environment variables**, add:
   - `ADMIN_PASSWORD`: a new private admin password
   - `ADMIN_TOKEN_SECRET`: a long random value, ideally at least 32 characters
6. Make sure both variables are available to **Functions**, then trigger a new production deploy.
7. Open the production site, click **Admin**, and sign in with the new password.
8. The first successful admin session migrates the data from that browser's previous local storage if no shared data exists yet.

## Local testing

```bash
npm install
npx netlify dev
```

For local testing, create a `.env` file (do not commit it):

```text
ADMIN_PASSWORD=choose-a-new-password
ADMIN_TOKEN_SECRET=choose-a-long-random-secret
```

Open the local URL shown by Netlify CLI.

## How it works

- `/api/site-data` reads and writes the shared song queue.
- `/api/admin-login` verifies the server-side password and returns a 12-hour signed session token.
- `/api/media` stores uploaded artwork and audio separately from the JSON queue.
- Public pages check for changes every 15 seconds.
- New visitors load the latest published data immediately.
- Browser local storage remains only as a migration and emergency backup.


## Google Sites embedding

For the best chance of allowing the album-cover button to control Spotify, use Google Sites' **Embed code** option rather than only pasting the URL. Replace the URL below with your production URL:

```html
<iframe
  src="https://YOUR-SITE.netlify.app/"
  width="100%"
  height="1000"
  style="border:0"
  allow="autoplay; encrypted-media; fullscreen; clipboard-write"
  allowfullscreen
></iframe>
```

Google Sites still places this inside its own iframe. Some browsers may therefore block programmatic Spotify playback even after a direct click. The page now detects that case, scrolls to the official Spotify player, and asks the visitor to tap it directly.

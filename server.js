import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8081;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Static files (serve dashboard and assets)
app.use(express.static(__dirname));

// Start OAuth: redirect user to GitHub authorization page
app.get('/auth/github/login', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).send('Missing GITHUB_CLIENT_ID in environment');
  }
  const redirectUri = `${BASE_URL}/auth/github/callback`;
  const scope = 'repo';
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  res.redirect(url.toString());
});

// OAuth callback: exchange code for access token, then redirect back to dashboard with token in hash
app.get('/auth/github/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).send('Missing GitHub OAuth credentials');
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/auth/github/callback`
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return res.status(500).send(`Failed to obtain token: ${JSON.stringify(tokenJson)}`);
    }

    const token = tokenJson.access_token;
    // Redirect back to dashboard with token in hash so it doesn't hit server logs
    res.redirect(`/dashboard.html#gh=${encodeURIComponent(token)}`);
  } catch (err) {
    res.status(500).send(`OAuth error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});

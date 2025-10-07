import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

// Basic CORS support (for GitHub Pages frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
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

// ===== GitHub helpers =====
async function ghRequest(endpoint, { method = 'GET', token, body } = {}) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function ensureRepo({ token, name, description }) {
  try {
    // Try to create; if exists, 422
    return await ghRequest('/user/repos', {
      method: 'POST', token,
      body: { name, private: true, auto_init: true, description }
    });
  } catch (e) {
    if (e.message.includes('422')) {
      // Fetch current user to build owner/repo
      const user = await ghRequest('/user', { token });
      // Return minimal info
      return { name, owner: { login: user.login } };
    }
    throw e;
  }
}

async function getContentSha({ token, owner, repo, path }) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Get contents failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.sha || null;
}

async function putFile({ token, owner, repo, path: filePath, message, content }) {
  const sha = await getContentSha({ token, owner, repo, path: filePath });
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha: sha || undefined
  };
  return ghRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: 'PUT', token, body
  });
}

async function putBinary({ token, owner, repo, path: filePath, message, buffer }) {
  const sha = await getContentSha({ token, owner, repo, path: filePath });
  const body = {
    message,
    content: buffer.toString('base64'),
    sha: sha || undefined
  };
  return ghRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: 'PUT', token, body
  });
}

async function downloadVanillaJar(version) {
  // Mojang manifest
  const manRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  if (!manRes.ok) throw new Error(`Failed to fetch version manifest: ${manRes.status}`);
  const manifest = await manRes.json();
  let targetId = version;
  if (!version || version === 'latest') targetId = manifest.latest.release;
  const entry = manifest.versions.find(v => v.id === targetId);
  if (!entry) throw new Error(`Version not found in Mojang manifest: ${version}`);
  const vRes = await fetch(entry.url);
  if (!vRes.ok) throw new Error(`Failed to fetch version json: ${vRes.status}`);
  const vJson = await vRes.json();
  const url = vJson?.downloads?.server?.url;
  if (!url) throw new Error('Server JAR URL not found for this version');
  const jarRes = await fetch(url);
  if (!jarRes.ok) throw new Error(`Failed to download vanilla jar: ${jarRes.status}`);
  const buf = Buffer.from(await jarRes.arrayBuffer());
  const filename = 'server.jar';
  return { buffer: buf, filename };
}

async function downloadPaperJar(version) {
  // PaperMC API
  const vRes = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${encodeURIComponent(version)}`);
  if (!vRes.ok) throw new Error(`Paper: version not found: ${version}`);
  const vJson = await vRes.json();
  const builds = vJson.builds || [];
  if (!builds.length) throw new Error('Paper: no builds for this version');
  const build = builds[builds.length - 1];
  const fileName = `paper-${version}-${build}.jar`;
  const url = `https://api.papermc.io/v2/projects/paper/versions/${encodeURIComponent(version)}/builds/${build}/downloads/${fileName}`;
  const jarRes = await fetch(url);
  if (!jarRes.ok) throw new Error(`Failed to download paper jar: ${jarRes.status}`);
  const buf = Buffer.from(await jarRes.arrayBuffer());
  return { buffer: buf, filename: 'server.jar' };
}

// ===== API: create server repo with initial files =====
app.post('/api/servers', async (req, res) => {
  try {
    const { name, version = 'latest', software = 'Vanilla', token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Missing token' });
    if (!name) return res.status(400).json({ error: 'Missing server name' });

    const user = await ghRequest('/user', { token });
    const owner = user.login;
    const repo = name;

    // Create or ensure repo
    const repoInfo = await ensureRepo({ token, name: repo, description: `Minecraft server ${name} (${software} ${version})` });

    // Initial files
    const files = [
      { path: 'README.md', content: `# ${name}\n\nSoftware: ${software}\n\nVersion: ${version}\n` },
      { path: 'eula.txt', content: `eula=true\n` },
      { path: 'server.properties', content: `motd=${name}\nmax-players=20\n` },
      { path: '.env', content: `START=false\nVERSION=${version}\nSOFTWARE=${software}\n` },
      { path: '.github/workflows/setup.yml', content: `name: Setup Server\n\non: [push]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Show config\n        run: |\n          echo \"SOFTWARE=${software}\"\n          echo \"VERSION=${version}\"\n          grep -E '^(START|VERSION|SOFTWARE)=' .env || true\n` }
    ];

    for (const f of files) {
      await putFile({ token, owner, repo, path: f.path, message: `Add ${f.path}`, content: f.content });
    }

    // Download appropriate server jar
    let jar;
    const sw = (software || '').toLowerCase();
    if (sw === 'vanilla' || sw === 'default') {
      jar = await downloadVanillaJar(version);
    } else if (sw === 'paper') {
      jar = await downloadPaperJar(version);
    } else if (sw === 'spigot') {
      // Fallback to Paper for compatibility as Spigot jars are not directly downloadable via API
      jar = await downloadPaperJar(version);
    } else {
      jar = await downloadVanillaJar(version);
    }

    // Upload jar as server.jar
    await putBinary({ token, owner, repo, path: jar.filename, message: 'Add server jar', buffer: jar.buffer });

    // Add start scripts
    const startSh = `#!/usr/bin/env bash\njava -Xmx4096M -Xms4096M -jar server.jar nogui\n`;
    const startBat = `@echo off\njava -Xmx4096M -Xms4096M -jar server.jar nogui\n`;
    await putFile({ token, owner, repo, path: 'start.sh', message: 'Add start script (Linux/macOS)', content: startSh });
    await putFile({ token, owner, repo, path: 'start.bat', message: 'Add start script (Windows)', content: startBat });

    return res.json({ ok: true, owner, repo });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ===== API: start server (toggle START=true in .env) =====
app.post('/api/servers/:name/start', async (req, res) => {
  try {
    const { token } = req.body || {};
    const name = req.params.name;
    if (!token) return res.status(400).json({ error: 'Missing token' });
    if (!name) return res.status(400).json({ error: 'Missing server name' });
    const user = await ghRequest('/user', { token });
    const owner = user.login;
    const repo = name;

    // Compose .env content with START=true. Try to read current .env
    let envContent = `START=true\n`;
    try {
      const resEnv = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.env`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
      });
      if (resEnv.ok) {
        const json = await resEnv.json();
        const decoded = Buffer.from(json.content, 'base64').toString('utf8');
        const next = decoded.replace(/START\s*=\s*false/gi, 'START=true');
        envContent = /START\s*=/.test(decoded) ? decoded.replace(/START\s*=\s*\w+/i, 'START=true') : `START=true\n` + decoded;
      }
    } catch {}

    await putFile({ token, owner, repo, path: '.env', message: 'Start server: set START=true', content: envContent });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ===== API: stop server (toggle START=false in .env) =====
app.post('/api/servers/:name/stop', async (req, res) => {
  try {
    const { token } = req.body || {};
    const name = req.params.name;
    if (!token) return res.status(400).json({ error: 'Missing token' });
    if (!name) return res.status(400).json({ error: 'Missing server name' });
    const user = await ghRequest('/user', { token });
    const owner = user.login;
    const repo = name;

    let envContent = `START=false\n`;
    try {
      const resEnv = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.env`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
      });
      if (resEnv.ok) {
        const json = await resEnv.json();
        const decoded = Buffer.from(json.content, 'base64').toString('utf8');
        envContent = /START\s*=/.test(decoded) ? decoded.replace(/START\s*=\s*\w+/i, 'START=false') : `START=false\n` + decoded;
      }
    } catch {}

    await putFile({ token, owner, repo, path: '.env', message: 'Stop server: set START=false', content: envContent });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});

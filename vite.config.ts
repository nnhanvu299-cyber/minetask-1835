import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function apiBackendPlugin() {
  const dataFile = path.resolve(__dirname, 'data/store.json');
  const onlinePresences = new Map<string, { userId: string; name: string; avatarKey: string; role: string; lastSeen: number }>();

  const getCleanOnlinePresences = () => {
    const now = Date.now();
    for (const [id, p] of onlinePresences.entries()) {
      if (now - p.lastSeen > 25000) {
        onlinePresences.delete(id);
      }
    }
    return Array.from(onlinePresences.values());
  };

  const isDefaultMockUser = (u: any) => {
    if (!u) return true;
    const em = (u.email || '').toLowerCase().trim();
    const id = (u.id || '').toLowerCase().trim();
    const name = (u.name || '').toLowerCase().trim();
    return (
      em === 'admin@1835.vn' ||
      em === 'steve@1835.vn' ||
      em.endsWith('@1835s.team') ||
      em.includes('tuanminh') ||
      em.includes('hoangnam') ||
      id === 'user_steve_default' ||
      id === 'user_tuan_minh_1835' ||
      id === 'user_hoang_nam_1835' ||
      id === 'steve' ||
      id === 'alex' ||
      id === 'devon' ||
      id === 'luna' ||
      name === 'steve' ||
      name === 'alex' ||
      name === 'devon' ||
      name === 'tuấn minh' ||
      name === 'hoàng nam' ||
      name === 'thợ mỏ 1835'
    );
  };

  const readStore = () => {
    try {
      if (fs.existsSync(dataFile)) {
        const store = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
        if (Array.isArray(store.users)) {
          store.users = store.users.filter((u: any) => !isDefaultMockUser(u));
        }
        return store;
      }
    } catch (e) {
      console.error('Read store error:', e);
    }
    return { users: [], worlds: [], tasks: [] };
  };

  const writeStore = (data: any) => {
    try {
      if (Array.isArray(data.users)) {
        data.users = data.users.filter((u: any) => !isDefaultMockUser(u));
      }
      const dir = path.dirname(dataFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Write store error:', e);
    }
  };

  return {
    name: 'api-backend-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url.startsWith('/api/')) return next();

        // Enable CORS for local network and all devices (phones, tablets, PCs)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.url.startsWith('/api/sync') && req.method === 'GET') {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const uid = urlObj.searchParams.get('uid');
            const name = urlObj.searchParams.get('name');
            const avatar = urlObj.searchParams.get('avatar');
            if (uid) {
              onlinePresences.set(uid, {
                userId: uid,
                name: name ? decodeURIComponent(name) : 'Thợ Mỏ 1835',
                avatarKey: avatar || 'sniffer',
                role: 'Thành viên Co-op',
                lastSeen: Date.now(),
              });
            }
          } catch {}
          const store = readStore();
          const onlineMembers = getCleanOnlinePresences();
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ ...store, onlineMembers }));
        }

        if (req.url.startsWith('/api/sync') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              if (payload.presence && payload.presence.userId) {
                onlinePresences.set(payload.presence.userId, {
                  userId: payload.presence.userId,
                  name: payload.presence.name,
                  avatarKey: payload.presence.avatarKey || 'sniffer',
                  role: payload.presence.role || 'Thành viên Co-op',
                  lastSeen: Date.now(),
                });
              }

              const store = readStore();
              if (Array.isArray(payload.users)) {
                if (payload.replaceUsers) {
                  store.users = payload.users;
                } else {
                  const userMap = new Map();
                  store.users.forEach((u: any) => {
                    if (u && u.email) userMap.set(u.email.toLowerCase(), u);
                  });
                  payload.users.forEach((u: any) => {
                    if (u && u.email) userMap.set(u.email.toLowerCase(), u);
                  });
                  store.users = Array.from(userMap.values());
                }
              }
              if (Array.isArray(payload.worlds) && payload.worlds.length > 0) {
                store.worlds = payload.worlds;
              }
              if (Array.isArray(payload.tasks) && payload.tasks.length > 0) {
                store.tasks = payload.tasks;
              }
              writeStore(store);
              const onlineMembers = getCleanOnlinePresences();
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, store, onlineMembers }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ success: false, error: err?.message }));
            }
          });
          return;
        }

        if (req.url === '/api/register' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const store = readStore();
              const trimmedEmail = (payload.email || '').trim().toLowerCase();
              const trimmedName = (payload.name || '').trim();

              const existing = store.users.find((u: any) => 
                (u.email && u.email.toLowerCase() === trimmedEmail) || 
                (u.name && u.name.toLowerCase() === trimmedName.toLowerCase())
              );

              if (existing) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Tên hoặc Email này đã được sử dụng.' }));
              }

              const newUser = {
                id: `user_${Date.now()}`,
                name: trimmedName,
                email: trimmedEmail,
                password: payload.password,
                role: 'Thành viên Co-op 1835',
                title: 'Thợ Mỏ Co-op',
                level: 1,
                avatarKey: payload.avatarKey || 'sniffer',
                favoriteBiome: 'Rừng Hoa Anh Đào',
                tasksMined: 0,
                totalXp: 0,
                primaryColor: '#F37022',
              };

              store.users.push(newUser);
              writeStore(store);

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, user: newUser }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ success: false, error: err?.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

const versionFilePath = path.resolve(__dirname, 'public/version.json');
let versionData = {
  version: Date.now(),
  buildTime: new Date().toISOString(),
  note: 'Bản cập nhật 1835: Gõ phím siêu mượt, gửi & dán ảnh, reply, thả cảm xúc nổi và mở liên kết!'
};

try {
  if (fs.existsSync(versionFilePath)) {
    const raw = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
    versionData = {
      version: typeof raw.version === 'number' ? raw.version : Date.now(),
      buildTime: raw.buildTime || new Date().toISOString(),
      note: raw.note || versionData.note
    };
  }
} catch (e) {
  console.warn('Error reading version.json:', e);
}

// In build mode, generate a fresh unique build version and save back to public/version.json
const isProductionBuild = process.env.NODE_ENV === 'production' || process.argv.includes('build');
if (isProductionBuild) {
  versionData.version = Date.now();
  versionData.buildTime = new Date().toISOString();
  try {
    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving updated version.json:', e);
  }
}

function versionPlugin() {
  return {
    name: 'version-plugin',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(versionData, null, 2)
      });
    }
  };
}

export default defineConfig({
  base: './',
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(versionData.version),
    __APP_BUILD_TIME__: JSON.stringify(versionData.buildTime),
    __APP_BUILD_NOTE__: JSON.stringify(versionData.note)
  },
  plugins: [react(), tailwindcss(), apiBackendPlugin(), versionPlugin()],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/android/**', '**/dist/**', '**/data/**', '**/*.apk']
    }
  },
  preview: {
    port: 3000,
    host: true
  }
});

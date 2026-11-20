import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

console.log('🚀 Đang đẩy bản cập nhật lên GitHub Pages (https://nnhanvu299-cyber.github.io/minetask-1835/)...');
const gitDir = path.join(distDir, '.git');
if (fs.existsSync(gitDir)) {
  fs.rmSync(gitDir, { recursive: true, force: true });
}

execSync('git init', { cwd: distDir, stdio: 'inherit' });
execSync('git config user.name "MineTask Agent"', { cwd: distDir, stdio: 'inherit' });
execSync('git config user.email "minetask@agent.local"', { cwd: distDir, stdio: 'inherit' });
execSync('git remote add origin https://github.com/nnhanvu299-cyber/minetask-1835.git', { cwd: distDir, stdio: 'inherit' });
execSync('git checkout -B gh-pages', { cwd: distDir, stdio: 'inherit' });
execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
execSync(`git commit -m "🚀 Updates: auto-deploy ${new Date().toISOString()}"`, { cwd: distDir, stdio: 'inherit' });
execSync('git push -f origin gh-pages', { cwd: distDir, stdio: 'inherit' });
fs.rmSync(gitDir, { recursive: true, force: true });

console.log('✅ Đã đẩy bản cập nhật lên GitHub Pages thành công!');

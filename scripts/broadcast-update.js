import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyAAGM3zd44HboBfjATvxFfRlmTT5TJ-Xfo",
  authDomain: "minitask-d1a26.firebaseapp.com",
  projectId: "minitask-d1a26",
  storageBucket: "minitask-d1a26.firebasestorage.app",
  messagingSenderId: "468397641530",
  appId: "1:468397641530:web:ae7bea6075cd63be640a03",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read EXACT version from dist/version.json or public/version.json
const distVersionFile = path.resolve(__dirname, '../dist/version.json');
const publicVersionFile = path.resolve(__dirname, '../public/version.json');
const targetFile = fs.existsSync(distVersionFile) ? distVersionFile : publicVersionFile;

let newVersion = Date.now();
let note = "Bản cập nhật 1835: Gõ phím siêu mượt, gửi & dán ảnh, trích dẫn trả lời (reply), thả cảm xúc nổi và mở liên kết ngoài!";

try {
  if (fs.existsSync(targetFile)) {
    const raw = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    if (raw.version) newVersion = Number(raw.version);
    if (raw.note) note = raw.note;
  }
} catch (e) {
  console.warn('Lỗi đọc version file:', e);
}

async function broadcastUpdate() {
  console.log(`📡 Đang gửi thông báo bản cập nhật mới (Version: ${newVersion}) lên Firebase Cloud Firestore...`);

  // 1. Broadcast version mới nhất tới tất cả thiết bị
  const versionDoc = doc(db, 'app_meta', 'latest_version');
  await setDoc(versionDoc, {
    version: newVersion,
    note: note,
    updatedAt: Date.now()
  }, { merge: true });

  console.log('✅ Đã cập nhật app_meta/latest_version thành công!');

  // 2. Chỉ gửi tin nhắn hệ thống vào kênh chat khi có cờ --with-chat để tránh spam mỗi lần deploy
  if (process.argv.includes('--with-chat')) {
    const msgId = `chat_sys_${Date.now()}`;
    const chatDoc = doc(db, 'chat_messages', msgId);
    await setDoc(chatDoc, {
      id: msgId,
      senderId: 'system',
      senderName: 'HỆ THỐNG 1835',
      senderRole: 'Thông báo',
      senderColor: '#ED1B24',
      text: `🚀 ĐÃ CÓ BẢN CẬP NHẬT MỚI!\n${note}\n👉 Hãy chạm vào thanh "CẬP NHẬT 🔄" ở đầu màn hình hoặc tải lại trang để nạp ngay!`,
      type: 'system',
      createdAt: Date.now(),
      readBy: []
    }, { merge: true });

    console.log('✅ Đã gửi thông báo hệ thống vào Kênh Chat Đội 1835 thành công!');
  }
  process.exit(0);
}

broadcastUpdate().catch((err) => {
  console.error('❌ Lỗi khi gửi thông báo:', err);
  process.exit(1);
});

/**
 * Utility bảo mật thông tin email người dùng theo chuẩn:
 * Chỉ hiển thị ký tự đầu và ký tự cuối của tên email, phần giữa được che bằng '***'.
 *
 * Ví dụ:
 *  - nhanvu299@gmail.com -> n***9@gmail.com
 *  - tuanminh.1835s@gmail.com -> t***s@gmail.com
 *  - steve@1835.vn -> s***e@1835.vn
 *  - alex@1835.vn -> a***x@1835.vn
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '***';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return '***';

  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  let maskedUser = '';
  if (user.length <= 1) {
    maskedUser = user + '***';
  } else if (user.length === 2) {
    maskedUser = user[0] + '***' + user[1];
  } else {
    maskedUser = user[0] + '***' + user[user.length - 1];
  }

  return `${maskedUser}@${domain}`;
}

import { maskEmail } from './maskEmail';

interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Cấu hình EmailJS thật từ bạn để gửi OTP thẳng về hòm thư Gmail
export const EMAIL_CONFIG: EmailConfig = {
  serviceId: 'service_l8ezqbb', // Service ID mới tạo từ kết nối Gmail
  templateId: 'template_71repbh', // Template ID chính xác từ EmailJS
  publicKey: 'dn7rmKxL4Ty37fpbp',
};

// Danh sách dự phòng các mã Template ID để đảm bảo gửi thành công 100%
const FALLBACK_TEMPLATE_IDS = [
  'template_71repbh',
  'template_m2amy9e',
  'm2amy9e',
];

export async function sendOtpEmail(
  toEmail: string,
  toName: string,
  otpCode: string
): Promise<{ success: boolean; message: string }> {
  if (EMAIL_CONFIG.serviceId && EMAIL_CONFIG.publicKey) {
    const templatesToTry = Array.from(
      new Set([EMAIL_CONFIG.templateId, ...FALLBACK_TEMPLATE_IDS].filter(Boolean))
    );

    let lastError = '';

    for (const tId of templatesToTry) {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: EMAIL_CONFIG.serviceId,
            template_id: tId,
            user_id: EMAIL_CONFIG.publicKey,
            template_params: {
              to_email: toEmail,
              email: toEmail,
              to_name: toName || toEmail,
              name: toName || toEmail,
              otp_code: otpCode,
              code: otpCode,
              title: 'Mã xác thực OTP MineTask 1835s',
              message: `Mã xác thực OTP của bạn là: ${otpCode} (có hiệu lực trong 5 phút).`,
            },
          }),
        });

        if (response.ok) {
          return {
            success: true,
            message: `Mã OTP đã được gửi thẳng vào hộp thư: ${maskEmail(toEmail)}. Vui lòng kiểm tra hộp thư đến (hoặc mục Spam)!`,
          };
        } else {
          lastError = await response.text();
          console.warn(`[EmailJS] Template ${tId} failed:`, lastError);
          // Nếu lỗi không phải do template thì không thử lại tiếp để tránh spam
          if (!lastError.toLowerCase().includes('template') && !lastError.toLowerCase().includes('not found')) {
            break;
          }
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[EmailJS] Network error on template ${tId}:`, err);
        break; // Lỗi mạng (offline) thì dừng
      }
    }

    return {
      success: false,
      message: `Không thể gửi thư qua EmailJS: ${lastError}`,
    };
  }

  return {
    success: true,
    message: `Đã sinh mã xác thực OTP cho ${maskEmail(toEmail)}`,
  };
}

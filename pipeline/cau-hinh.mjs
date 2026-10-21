// Cấu hình theo máy: đọc .env một lần, dùng chung cho pipeline, script cài đặt và remotion.config.ts.
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// remotion.config.ts bị Remotion dịch sang CommonJS, import.meta rỗng: khi đó lấy thư mục đang chạy (gốc repo)
export const GOC = import.meta.url ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') : process.cwd();

const docEnv = () => {
	const f = path.join(GOC, '.env');
	if (!existsSync(f)) return;
	for (const dong of readFileSync(f, 'utf8').split('\n')) {
		const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
};
docEnv();

// Thương hiệu dùng khi job không ghi "thuongHieu"
export const THUONG_HIEU_MAC_DINH = process.env.THUONG_HIEU || 'mau';

// whisper.cpp + model; `npm run cai-dat` cài vào đây. Đã có sẵn ở chỗ khác thì trỏ WHISPER_DIR tới đó.
export const WHISPER = process.env.WHISPER_DIR ? path.resolve(GOC, process.env.WHISPER_DIR) : path.join(GOC, 'whisper.cpp');
export const WHISPER_VERSION = '1.7.6';
export const WHISPER_MODEL = 'large-v3-turbo';

// Để trống thì Remotion tự tải Chrome vào node_modules. Ổ exFAT không có symlink nên phải đặt Chrome ở ổ khác và trỏ tới đây.
export const CHROME = process.env.CHROME_HEADLESS || null;

// Cổng riêng cho server render, tránh đụng Remotion Studio hay server khác đang chạy ở 3000+
export const CONG = Number(process.env.REMOTION_RENDER_PORT ?? 3910);

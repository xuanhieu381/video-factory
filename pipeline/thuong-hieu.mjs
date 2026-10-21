// Chọn thương hiệu lúc đóng gói: '@thuong-hieu' → public/thuong-hieu/<ma>/thuong-hieu.json
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {GOC, THUONG_HIEU_MAC_DINH} from './cau-hinh.mjs';

export const maThuongHieu = (job) => job.thuongHieu ?? THUONG_HIEU_MAC_DINH;

export const fileThuongHieu = (ma) => {
	const f = path.join(GOC, 'public', 'thuong-hieu', ma, 'thuong-hieu.json');
	if (!existsSync(f)) {
		const co = readdirSync(path.join(GOC, 'public', 'thuong-hieu')).filter((d) => !d.startsWith('.'));
		throw new Error(`Không có thương hiệu "${ma}". Đang có: ${co.join(', ')}`);
	}
	return f;
};

export const ganThuongHieu = (ma) => (config) => ({
	...config,
	resolve: {...config.resolve, alias: {...config.resolve?.alias, '@thuong-hieu$': fileThuongHieu(ma)}},
});

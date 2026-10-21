import {loadFont as loadBeVietnamPro} from '@remotion/google-fonts/BeVietnamPro';
import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
// '@thuong-hieu' trỏ tới public/thuong-hieu/<ma>/thuong-hieu.json, chọn lúc đóng gói
// (pipeline đọc job.thuongHieu; Studio đọc biến môi trường THUONG_HIEU). Mặc định: mau.
import thuongHieu from '@thuong-hieu';

// Font Google cần import tĩnh: thêm thương hiệu dùng font khác thì thêm một dòng ở đây.
const FONT: Record<string, () => string> = {
	BeVietnamPro: () => loadBeVietnamPro('normal', {weights: ['500', '700', '800'], subsets: ['vietnamese', 'latin']}).fontFamily,
	Montserrat: () => loadMontserrat('normal', {weights: ['500', '700', '800'], subsets: ['vietnamese', 'latin']}).fontFamily,
};

const taiFont = FONT[thuongHieu.font];
if (!taiFont) throw new Error(`Font "${thuongHieu.font}" chưa có trong src/brand.ts`);

const thuMuc = `thuong-hieu/${thuongHieu.ma}`;

// Bộ nhận diện của thương hiệu đang chạy. Đổi trong thuong-hieu.json là đổi cho mọi mẫu.
export const BRAND = {
	...thuongHieu.mau,
	font: taiFont(),
	logo: `${thuMuc}/${thuongHieu.logo}`,
	bieuTuong: `${thuMuc}/${thuongHieu.bieuTuong ?? thuongHieu.logo}`,
	thuMuc,
	outro: thuongHieu.outro ?? 'logo',
	outroVideo: thuongHieu.outroVideo ? `${thuMuc}/${thuongHieu.outroVideo}` : undefined,
	tenKenh: thuongHieu.tenKenh,
	ctaMacDinh: thuongHieu.ctaMacDinh,
};

// Màu nhấn theo vai trò nội dung (công thức 02: Lạnh / Ấm / Nóng)
export const MAU_VAI_TRO = {
	lanh: BRAND.chinh,
	am: BRAND.chinh,
	nong: BRAND.noiBat,
} as const;

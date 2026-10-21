import type {Caption} from '@remotion/captions';

export type VaiTro = 'lanh' | 'am' | 'nong';

export type Cta = {chu: string; phu?: string};

// Ảnh chèn vào video quay, bám theo thời điểm trong clip đã cắt lặng
export type Chen = {
	tuGiay: number;
	denGiay: number;
	anh: string; // đường dẫn trong public/
	chu?: string;
};

// Nhãn chữ không kèm ảnh: "the" = thẻ ý chính (kiểu Hook), "nho" = nhãn nhỏ (tên, ghi chú)
export type Nhan = {
	tuGiay: number;
	denGiay: number;
	chu: string;
	kieu: 'the' | 'nho';
};

export type PropsQuayNoi = {
	clip: string; // trong public/
	hook: string;
	vaiTro: VaiTro;
	phuDe: Caption[];
	chen: Chen[];
	nhan?: Nhan[];
	cta: Cta;
	thoiLuongClip: number; // giây
};

export type Canh = {
	giong: string; // file âm thanh trong public/
	thoiLuong: number; // giây
	chu: string; // dòng chữ lớn trên màn hình
	anh?: string;
	phuDe: Caption[];
};

export type PropsDoHoa = {
	hook: string;
	vaiTro: VaiTro;
	canh: Canh[];
	cta: Cta;
	nhacNen?: string;
};

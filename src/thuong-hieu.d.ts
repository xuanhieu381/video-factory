// Cấu trúc public/thuong-hieu/<ma>/thuong-hieu.json
declare module '@thuong-hieu' {
	const thuongHieu: {
		ma: string;
		nganh?: string; // goi-nganh/<nganh>/nganh.yaml, dùng cho QA từ cấm
		tenKenh: string;
		font: string;
		mau: {
			chinh: string;
			chinhDam: string;
			noiBat: string;
			nen: string;
			trang: string;
			den: string;
			nenMoDauCuoi: string;
			nenManKetCuoi: string;
			phuDeDangNoi: string;
			phuDeDangNoiNong: string;
		};
		logo: string; // trong thư mục thương hiệu
		bieuTuong?: string; // icon nhỏ ở màn mở đầu, mặc định = logo
		outro?: 'logo' | 'video';
		outroVideo?: string; // khi outro = "video": mp4 trong thư mục thương hiệu
		ctaMacDinh: {chu: string; phu?: string};
	};
	export default thuongHieu;
}

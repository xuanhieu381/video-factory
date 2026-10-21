import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

// Đoạn mở đầu: nền trơn, chữ hook chạy vào từng từ, rồi cả màn trượt lên để lộ video.
// Bọc từ bằng *dấu sao* để tô màu nhấn, ví dụ: "Gần *50 tuổi*, bắt đầu học".
export const TRUOT_RA = 0.45; // giây cuối: màn mở đầu trượt lên, video đã chạy bên dưới
const TRE_MOI_TU = 0.09;

const tachTu = (chu: string) => {
	let nhan = false;
	return chu
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => {
			const batDau = w.startsWith('*');
			if (batDau) nhan = true;
			const tu = {chu: w.replace(/\*/g, ''), nhan};
			if (w.endsWith('*') && (w.length > 1 || !batDau)) nhan = false;
			return tu;
		});
};

export const thoiLuongMoDau = (chu: string) => {
	const soTu = tachTu(chu).length;
	return Math.min(3.6, Math.max(2.2, 0.3 + soTu * TRE_MOI_TU + 0.5 + 1.0 + TRUOT_RA));
};

const RA = Easing.bezier(0.16, 1, 0.3, 1);
const kep = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const MoDau: React.FC<{chu: string}> = ({chu}) => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();
	const tu = tachTu(chu);
	const tong = thoiLuongMoDau(chu) * fps;
	const batDauRa = tong - TRUOT_RA * fps;
	const hetChu = (0.3 + tu.length * TRE_MOI_TU + 0.5) * fps;

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(180deg, ${BRAND.nen} 0%, ${BRAND.nenMoDauCuoi} 100%)`,
				alignItems: 'center',
				justifyContent: 'center',
				translate: interpolate(frame, [batDauRa, tong], ['0px 0px', `0px ${-height}px`], {...kep, easing: Easing.bezier(0.7, 0, 0.3, 1)}),
				boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
			}}
		>
			<Img
				src={staticFile(BRAND.bieuTuong)}
				style={{
					position: 'absolute',
					// Ảnh lớp sen giữ nguyên khổ logo 1200×962; với rộng 740 thì bông sen (rộng ~260px) có tâm ở top + 220
					top: 420,
					width: 740,
					opacity: interpolate(frame, [0, 0.4 * fps], [0, 0.9], kep),
					scale: interpolate(frame, [0, 0.6 * fps], [0.8, 1], {...kep, easing: RA}),
				}}
			/>
			<div
				style={{
					maxWidth: '84%',
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					columnGap: 26,
					rowGap: 6,
					fontFamily: BRAND.font,
					fontWeight: 800,
					fontSize: 96,
					lineHeight: 1.15,
					color: BRAND.chinhDam,
					textAlign: 'center',
				}}
			>
				{tu.map((w, i) => {
					const vao = (0.3 + i * TRE_MOI_TU) * fps;
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								color: w.nhan ? BRAND.noiBat : BRAND.chinhDam,
								opacity: interpolate(frame, [vao, vao + 0.3 * fps], [0, 1], kep),
								translate: interpolate(frame, [vao, vao + 0.5 * fps], ['0px 70px', '0px 0px'], {...kep, easing: RA}),
								filter: `blur(${interpolate(frame, [vao, vao + 0.35 * fps], [14, 0], kep)}px)`,
							}}
						>
							{w.chu}
						</span>
					);
				})}
			</div>
			<div
				style={{
					position: 'absolute',
					top: height / 2 + 260,
					width: 180,
					height: 12,
					borderRadius: 6,
					background: BRAND.noiBat,
					scale: `${interpolate(frame, [hetChu - 0.3 * fps, hetChu + 0.2 * fps], [0, 1], {...kep, easing: RA})} 1`,
				}}
			/>
		</AbsoluteFill>
	);
};

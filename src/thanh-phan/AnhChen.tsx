import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

// Thẻ ảnh (sản phẩm, minh hoạ) bật lên ở nửa trên khung hình.
export const AnhChen: React.FC<{anh: string; chu?: string; thoiLuong: number}> = ({anh, chu, thoiLuong}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ra = thoiLuong * fps;
	const hien = interpolate(frame, [0, 0.35 * fps, ra - 0.25 * fps, ra], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});

	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 200}}>
			<div
				style={{
					width: 760,
					background: BRAND.trang,
					borderRadius: 36,
					padding: 24,
					boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
					opacity: hien,
					scale: interpolate(hien, [0, 1], [0.85, 1]),
					rotate: interpolate(hien, [0, 1], ['-4deg', '0deg']),
				}}
			>
				<Img src={staticFile(anh)} style={{width: '100%', height: 760, objectFit: 'contain', borderRadius: 20, background: BRAND.nen}} />
				{chu ? (
					<div style={{fontFamily: BRAND.font, fontWeight: 700, fontSize: 44, color: BRAND.chinhDam, textAlign: 'center', padding: '20px 10px 6px'}}>
						{chu}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

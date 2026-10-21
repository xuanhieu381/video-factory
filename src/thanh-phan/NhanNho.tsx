import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

// Nhãn chữ nhỏ ở phần trên khung hình: tên nhân vật, "Trải nghiệm cá nhân"…
export const NhanNho: React.FC<{chu: string; mauNhan: string; thoiLuong: number}> = ({chu, mauNhan, thoiLuong}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ra = thoiLuong * fps;
	const hien = interpolate(frame, [0, 0.35 * fps, ra - 0.25 * fps, ra], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});

	return (
		<AbsoluteFill style={{alignItems: 'flex-start', paddingTop: 250, paddingLeft: 56}}>
			<div
				style={{
					maxWidth: '78%',
					background: 'rgba(255,255,255,0.94)',
					borderRadius: 18,
					borderLeft: `10px solid ${mauNhan}`,
					padding: '16px 26px',
					fontFamily: BRAND.font,
					fontWeight: 700,
					fontSize: 38,
					lineHeight: 1.3,
					color: BRAND.chinhDam,
					boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
					opacity: hien,
					translate: interpolate(hien, [0, 1], ['-40px 0px', '0px 0px']),
				}}
			>
				{chu}
			</div>
		</AbsoluteFill>
	);
};

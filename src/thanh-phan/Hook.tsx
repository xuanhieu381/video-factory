import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

// Câu hook to ở nửa trên màn hình trong vài giây đầu.
export const Hook: React.FC<{chu: string; mauNhan: string; thoiLuong: number}> = ({chu, mauNhan, thoiLuong}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ra = thoiLuong * fps;

	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 230}}>
			<div
				style={{
					maxWidth: '84%',
					background: BRAND.trang,
					borderRadius: 28,
					padding: '30px 44px',
					borderLeft: `16px solid ${mauNhan}`,
					boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
					fontFamily: BRAND.font,
					fontWeight: 800,
					fontSize: 64,
					lineHeight: 1.2,
					color: BRAND.chinhDam,
					textAlign: 'left',
					translate: interpolate(frame, [0, 0.45 * fps, ra - 0.3 * fps, ra], ['0px -120px', '0px 0px', '0px 0px', '0px -60px'], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.bezier(0.16, 1, 0.3, 1),
					}),
					opacity: interpolate(frame, [0, 0.3 * fps, ra - 0.3 * fps, ra], [0, 1, 1, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
				}}
			>
				{chu}
			</div>
		</AbsoluteFill>
	);
};

import {Video} from '@remotion/media';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

export const THOI_LUONG_OUTRO = 3.5;

const RA = Easing.bezier(0.16, 1, 0.3, 1);
const kep = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Outro mặc định cho thương hiệu chưa có outro riêng: logo phóng nhẹ vào giữa nền.
const OutroLogo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = (giay: number) => giay * fps;

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 50% 46%, ${BRAND.trang} 0%, ${BRAND.nen} 70%)`,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Img
				src={staticFile(BRAND.logo)}
				style={{
					width: 640,
					marginTop: -80,
					opacity: interpolate(frame, [t(0.1), t(0.6)], [0, 1], kep),
					scale: interpolate(frame, [t(0.1), t(1.0), t(THOI_LUONG_OUTRO)], [0.8, 1, 1.04], {...kep, easing: RA}),
				}}
			/>
		</AbsoluteFill>
	);
};

// Outro do thương hiệu tự dựng sẵn (mp4 dọc 1080×1920, dài THOI_LUONG_OUTRO giây), tắt tiếng.
const OutroVideo: React.FC = () => (
	<AbsoluteFill style={{background: BRAND.nen}}>
		<Video src={staticFile(BRAND.outroVideo!)} muted objectFit="cover" style={{width: '100%', height: '100%'}} />
	</AbsoluteFill>
);

// Thương hiệu chọn outro bằng trường "outro" trong thuong-hieu.json
export const Outro: React.FC = () => (BRAND.outro === 'video' && BRAND.outroVideo ? <OutroVideo /> : <OutroLogo />);

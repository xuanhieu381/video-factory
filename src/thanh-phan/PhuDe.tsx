import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

// Phụ đề kiểu karaoke: mỗi trang vài chữ, chữ đang nói được tô màu nhấn.
export const PhuDe: React.FC<{phuDe: Caption[]; mauNhan: string; viTri?: number}> = ({
	phuDe,
	mauNhan,
	viTri = 0.68,
}) => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();
	const ms = (frame / fps) * 1000;

	const {pages} = useMemo(
		() => createTikTokStyleCaptions({captions: phuDe, combineTokensWithinMilliseconds: 900}),
		[phuDe],
	);

	const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
	if (!page) return null;

	const vao = interpolate(ms - page.startMs, [0, 120], [0.85, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{alignItems: 'center'}}>
			<div
				style={{
					position: 'absolute',
					top: height * viTri,
					width: '86%',
					textAlign: 'center',
					fontFamily: BRAND.font,
					fontWeight: 800,
					fontSize: 66,
					lineHeight: 1.25,
					color: BRAND.trang,
					WebkitTextStroke: `10px ${BRAND.den}`,
					paintOrder: 'stroke fill',
					textShadow: '0 6px 18px rgba(0,0,0,0.45)',
					scale: vao,
				}}
			>
				{page.tokens.map((t) => {
					const dangNoi = ms >= t.fromMs && ms < t.toMs;
					return (
						<span key={t.fromMs} style={{color: dangNoi ? mauNhan === BRAND.noiBat ? BRAND.phuDeDangNoiNong : BRAND.phuDeDangNoi : BRAND.trang, whiteSpace: 'pre'}}>
							{t.text}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

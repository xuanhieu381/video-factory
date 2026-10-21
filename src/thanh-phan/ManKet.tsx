import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';
import type {Cta} from '../types';

// Màn kết: logo + lời mời hành động (công thức 07).
export const ManKet: React.FC<{cta: Cta; mauNhan: string}> = ({cta, mauNhan}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const len = (tre: number) =>
		interpolate(frame, [tre * fps, (tre + 0.5) * fps], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.bezier(0.16, 1, 0.3, 1),
		});

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(180deg, ${BRAND.nen} 0%, ${BRAND.nenManKetCuoi} 100%)`,
				alignItems: 'center',
				justifyContent: 'center',
				gap: 60,
				fontFamily: BRAND.font,
				opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {extrapolateRight: 'clamp'}),
			}}
		>
			<Img src={staticFile(BRAND.logo)} style={{width: 560, scale: interpolate(len(0), [0, 1], [0.8, 1])}} />
			<div
				style={{
					background: mauNhan,
					color: BRAND.trang,
					fontWeight: 800,
					fontSize: 62,
					padding: '34px 56px',
					borderRadius: 999,
					maxWidth: '86%',
					textAlign: 'center',
					lineHeight: 1.2,
					opacity: len(0.3),
					translate: interpolate(len(0.3), [0, 1], ['0px 60px', '0px 0px']),
				}}
			>
				{cta.chu}
			</div>
			{cta.phu ? (
				<div style={{fontSize: 40, fontWeight: 500, color: BRAND.chinhDam, opacity: len(0.6), textAlign: 'center', maxWidth: '80%'}}>
					{cta.phu}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

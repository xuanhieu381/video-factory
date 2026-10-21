import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND, MAU_VAI_TRO} from '../brand';
import {Outro, THOI_LUONG_OUTRO} from '../thanh-phan/Outro';
import {PhuDe} from '../thanh-phan/PhuDe';
import type {Canh, PropsDoHoa} from '../types';

export const THOI_LUONG_MAN_KET_DH = THOI_LUONG_OUTRO;

const NenDong: React.FC<{mauNhan: string}> = ({mauNhan}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: `linear-gradient(170deg, ${BRAND.chinhDam} 0%, ${BRAND.chinh} 70%)`}}>
			<div
				style={{
					position: 'absolute',
					width: 1400,
					height: 1400,
					borderRadius: '50%',
					border: `6px solid ${BRAND.noiBat}`,
					opacity: 0.25,
					left: -700,
					top: 1100,
					rotate: `${frame * 0.15}deg`,
				}}
			/>
			<div style={{position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', right: -420, top: -300, translate: `0px ${Math.sin(frame / 40) * 30}px`}} />
		</AbsoluteFill>
	);
};

const MotCanh: React.FC<{canh: Canh; mauNhan: string; laHook: boolean}> = ({canh, mauNhan, laHook}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const len = interpolate(frame, [0, 0.5 * fps], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});

	return (
		<AbsoluteFill>
			<Audio src={staticFile(canh.giong)} />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: canh.anh ? 220 : 520, gap: 50}}>
				<div
					style={{
						maxWidth: '86%',
						fontFamily: BRAND.font,
						fontWeight: 800,
						fontSize: laHook ? 88 : 74,
						lineHeight: 1.18,
						color: BRAND.trang,
						textAlign: 'center',
						opacity: len,
						translate: interpolate(len, [0, 1], ['0px 50px', '0px 0px']),
					}}
				>
					{canh.chu}
					<div style={{width: 140, height: 12, borderRadius: 6, background: BRAND.noiBat, margin: '36px auto 0', scale: `${len} 1`}} />
				</div>
				{canh.anh ? (
					<div style={{width: 700, height: 700, background: BRAND.trang, borderRadius: 40, padding: 24, opacity: len, scale: interpolate(len, [0, 1], [0.9, 1]), boxShadow: '0 24px 60px rgba(0,0,0,0.35)'}}>
						<Img src={staticFile(canh.anh)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
					</div>
				) : null}
			</AbsoluteFill>
			<PhuDe phuDe={canh.phuDe} mauNhan={mauNhan} viTri={0.8} />
		</AbsoluteFill>
	);
};

// Mẫu B: thuần đồ hoạ + giọng đọc AI, không cần quay.
export const DoHoa: React.FC<PropsDoHoa> = ({vaiTro, canh, nhacNen}) => {
	const {fps} = useVideoConfig();
	const mauNhan = MAU_VAI_TRO[vaiTro];
	let from = 0;

	return (
		<AbsoluteFill>
			<NenDong mauNhan={mauNhan} />
			<Img src={staticFile(BRAND.logo)} style={{position: 'absolute', top: 70, right: 56, width: 150, background: BRAND.trang, borderRadius: 24, padding: 10}} />
			{canh.map((c, i) => {
				const dur = Math.ceil(c.thoiLuong * fps);
				const seq = (
					<Sequence key={i} from={from} durationInFrames={dur} name={`Cảnh ${i + 1}`}>
						<MotCanh canh={c} mauNhan={mauNhan} laHook={i === 0} />
					</Sequence>
				);
				from += dur;
				return seq;
			})}
			<Sequence from={from} durationInFrames={Math.round(THOI_LUONG_MAN_KET_DH * fps)} name="Outro">
				<Outro />
			</Sequence>
			{nhacNen ? <Audio src={staticFile(nhacNen)} volume={0.12} loop /> : null}
		</AbsoluteFill>
	);
};

import {Video} from '@remotion/media';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND, MAU_VAI_TRO} from '../brand';
import {AnhChen} from '../thanh-phan/AnhChen';
import {Hook} from '../thanh-phan/Hook';
import {MoDau, thoiLuongMoDau, TRUOT_RA} from '../thanh-phan/MoDau';
import {NhanNho} from '../thanh-phan/NhanNho';
import {Outro, THOI_LUONG_OUTRO} from '../thanh-phan/Outro';
import {PhuDe} from '../thanh-phan/PhuDe';
import type {PropsQuayNoi} from '../types';

// Outro phủ lên 0.3s cuối của clip để chuyển cảnh mượt
const CHONG_OUTRO = 0.3;

// Mốc thời gian (khung hình) của mẫu: mở đầu → clip → outro
export const mocQuayNoi = (props: Pick<PropsQuayNoi, 'hook' | 'thoiLuongClip'>, fps: number) => {
	const moDau = Math.round(thoiLuongMoDau(props.hook) * fps);
	const batDauClip = moDau - Math.round(TRUOT_RA * fps);
	const khungClip = Math.ceil(props.thoiLuongClip * fps);
	const batDauOutro = batDauClip + khungClip - Math.round(CHONG_OUTRO * fps);
	const khungOutro = Math.round(THOI_LUONG_OUTRO * fps);
	return {moDau, batDauClip, khungClip, batDauOutro, khungOutro, tong: batDauOutro + khungOutro};
};

const HienDan: React.FC<{children: React.ReactNode}> = ({children}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{opacity: interpolate(frame, [0, CHONG_OUTRO * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)})}}>
			{children}
		</AbsoluteFill>
	);
};

// Mẫu A: người thật nói trước camera.
export const QuayNoi: React.FC<PropsQuayNoi> = ({clip, hook, vaiTro, phuDe, chen, nhan, thoiLuongClip}) => {
	const {fps} = useVideoConfig();
	const mauNhan = MAU_VAI_TRO[vaiTro];
	const moc = mocQuayNoi({hook, thoiLuongClip}, fps);

	return (
		<AbsoluteFill style={{background: BRAND.den}}>
			<Sequence from={moc.batDauClip} durationInFrames={moc.khungClip} name="Clip">
				<Video src={staticFile(clip)} objectFit="cover" style={{width: '100%', height: '100%'}} />
				<Img src={staticFile(BRAND.logo)} style={{position: 'absolute', top: 70, right: 56, width: 150, opacity: 0.92}} />
				{chen.map((c) => (
					<Sequence key={c.tuGiay} from={Math.round(c.tuGiay * fps)} durationInFrames={Math.round((c.denGiay - c.tuGiay) * fps)} name={`Ảnh: ${c.chu ?? c.anh}`}>
						<AnhChen anh={c.anh} chu={c.chu} thoiLuong={c.denGiay - c.tuGiay} />
					</Sequence>
				))}
				{(nhan ?? []).map((n) => (
					<Sequence key={`nhan-${n.tuGiay}`} from={Math.round(n.tuGiay * fps)} durationInFrames={Math.round((n.denGiay - n.tuGiay) * fps)} name={`Nhãn: ${n.chu}`}>
						{n.kieu === 'the' ? (
							<Hook chu={n.chu} mauNhan={mauNhan} thoiLuong={n.denGiay - n.tuGiay} />
						) : (
							<NhanNho chu={n.chu} mauNhan={mauNhan} thoiLuong={n.denGiay - n.tuGiay} />
						)}
					</Sequence>
				))}
				<PhuDe phuDe={phuDe} mauNhan={mauNhan} />
			</Sequence>
			<Sequence durationInFrames={moc.moDau} name="Mở đầu">
				<MoDau chu={hook} />
			</Sequence>
			<Sequence from={moc.batDauOutro} durationInFrames={moc.khungOutro} name="Outro">
				<HienDan>
					<Outro />
				</HienDan>
			</Sequence>
		</AbsoluteFill>
	);
};

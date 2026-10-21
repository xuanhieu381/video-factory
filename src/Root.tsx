import {Composition} from 'remotion';
import {DoHoa, THOI_LUONG_MAN_KET_DH} from './mau/DoHoa';
import {mocQuayNoi, QuayNoi} from './mau/QuayNoi';
import {BRAND} from './brand';
import {Outro, THOI_LUONG_OUTRO} from './thanh-phan/Outro';
import type {PropsDoHoa, PropsQuayNoi} from './types';

const FPS = 30;

const mauQuayNoi: PropsQuayNoi = {
	clip: 'jobs/vi-du/clip.mp4',
	hook: 'Câu hook hiện ở 3 giây đầu',
	vaiTro: 'lanh',
	phuDe: [],
	chen: [],
	cta: BRAND.ctaMacDinh,
	thoiLuongClip: 10,
};

const mauDoHoa: PropsDoHoa = {
	hook: '',
	vaiTro: 'am',
	canh: [],
	cta: BRAND.ctaMacDinh,
};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="QuayNoi"
			component={QuayNoi}
			fps={FPS}
			width={1080}
			height={1920}
			durationInFrames={300}
			defaultProps={mauQuayNoi}
			calculateMetadata={({props}) => ({
				durationInFrames: mocQuayNoi(props, FPS).tong,
			})}
		/>
		<Composition
			id="DoHoa"
			component={DoHoa}
			fps={FPS}
			width={1080}
			height={1920}
			durationInFrames={300}
			defaultProps={mauDoHoa}
			calculateMetadata={({props}) => ({
				durationInFrames: props.canh.reduce((s, c) => s + Math.ceil(c.thoiLuong * FPS), 0) + THOI_LUONG_MAN_KET_DH * FPS,
			})}
		/>
		<Composition id="Outro" component={Outro} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(THOI_LUONG_OUTRO * FPS)} />
	</>
);

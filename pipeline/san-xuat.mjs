// Video Factory. Thương hiệu chọn bằng job.thuongHieu (mặc định THUONG_HIEU trong .env, rồi tới "mau"), xem public/thuong-hieu/.
//   node pipeline/san-xuat.mjs chuan-bi kich-ban/<id>.json   → sơ chế, giọng đọc, chép lời → public/jobs/<id>/props.json
//   node pipeline/san-xuat.mjs render   kich-ban/<id>.json   → QA từ cấm, rồi thanh-pham/cho-duyet/<id>.mp4 + .jpg + .qa.txt
//   node pipeline/san-xuat.mjs qa       kich-ban/<id>.json   → chỉ chạy QA từ cấm
// Giữa hai bước: soát phụ đề trong props.json cho khớp kịch bản.
import {execFileSync, spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {toCaptions, transcribe} from '@remotion/install-whisper-cpp';
import {CHROME, CONG, GOC, WHISPER, WHISPER_MODEL, WHISPER_VERSION} from './cau-hinh.mjs';
import {baoCao, coNgoaiLe, docGoiNganh, kiemTra} from './qa.mjs';
import {fileThuongHieu, ganThuongHieu, maThuongHieu} from './thuong-hieu.mjs';

const FPS = 30;
const TOI_THIEU_GIAY = 60;
const chay = (cmd, args) => execFileSync(cmd, args, {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28}).toString();
const ffmpeg = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], {stdio: ['ignore', 'inherit', 'inherit']});
const thoiLuong = (f) => Number(chay('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());

// ---------- Sơ chế clip quay ----------

// Tìm các đoạn có tiếng nói (bỏ khoảng lặng dài hơn `lang` giây, chừa `dem` giây hai đầu).
const timDoan = (file, tongThoiLuong, {nguong = -35, lang = 0.45, dem = 0.12} = {}) => {
	// silencedetect ghi kết quả ra stderr
	const log = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-vn', '-af', `silencedetect=noise=${nguong}dB:d=${lang}`, '-f', 'null', '-'], {
		maxBuffer: 1 << 28,
	}).stderr.toString();
	const khoangLang = [];
	let batDau = null;
	for (const dong of log.split('\n')) {
		const s = dong.match(/silence_start: ([\d.]+)/);
		const e = dong.match(/silence_end: ([\d.]+)/);
		if (s) batDau = Number(s[1]);
		if (e && batDau !== null) {
			khoangLang.push([batDau, Number(e[1])]);
			batDau = null;
		}
	}
	if (batDau !== null) khoangLang.push([batDau, tongThoiLuong]);
	const doan = [];
	let con = 0;
	for (const [a, b] of khoangLang) {
		if (a > con) doan.push([Math.max(0, con - dem), Math.min(tongThoiLuong, a + dem)]);
		con = b;
	}
	if (con < tongThoiLuong) doan.push([Math.max(0, con - dem), tongThoiLuong]);
	return doan.filter(([a, b]) => b - a > 0.15);
};

const soCheClip = (vao, ra, job) => {
	const tong = thoiLuong(vao);
	const tu = job.cat?.tu ?? 0;
	const den = job.cat?.den ?? tong;
	let doan = [[tu, den]];
	if (job.catLang !== false) {
		doan = timDoan(vao, tong, job.catLangCaiDat)
			.map(([a, b]) => [Math.max(a, tu), Math.min(b, den)])
			.filter(([a, b]) => b - a > 0.15);
	}
	// select/aselect giữ các đoạn có tiếng trong một lần đọc video (nhanh hơn nhiều so với trim từng đoạn)
	const giu = doan.map(([a, b]) => `between(t,${a.toFixed(3)},${b.toFixed(3)})`).join('+');
	const filter =
		`[0:v]select='${giu}',setpts=N/FRAME_RATE/TB,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS},format=yuv420p[vo];` +
		`[0:a]aselect='${giu}',asetpts=N/SR/TB,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[ao]`;
	const fFilter = ra + '.filter.txt';
	writeFileSync(fFilter, filter);
	ffmpeg(['-i', vao, '-filter_complex_script', fFilter, '-map', '[vo]', '-map', '[ao]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', ra]);
	const truoc = den - tu;
	const sau = thoiLuong(ra);
	console.log(`  Cắt lặng: ${truoc.toFixed(1)}s → ${sau.toFixed(1)}s (${doan.length} đoạn)`);
	return sau;
};

// ---------- Chép lời (Whisper, tiếng Việt) ----------

const chepLoi = async (fileAmThanh, thuMuc) => {
	const wav = path.join(thuMuc, path.basename(fileAmThanh) + '.16k.wav');
	ffmpeg(['-i', fileAmThanh, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
	const out = await transcribe({
		inputPath: wav,
		whisperPath: WHISPER,
		whisperCppVersion: WHISPER_VERSION,
		model: WHISPER_MODEL,
		modelFolder: WHISPER,
		tokenLevelTimestamps: true,
		language: 'vi',
		splitOnWord: true,
		printOutput: false,
		// không dựa vào ngữ cảnh câu trước: giảm hẳn lỗi lặp chữ khi có tiếng động/nhạc
		additionalArgs: [['--max-context', '0']],
	});
	const {captions} = toCaptions({whisperCppOutput: out});
	const sach = boCauBia(captions).filter((c) => c.text.trim() !== '' && !/^\[.*\]$/.test(c.text.trim()));
	// Bỏ chuỗi một chữ lặp quá 3 lần liền (Whisper "ảo giác" khi gặp tiếng vỗ, tiếng thở)
	return sach.filter((c, i) => {
		const w = boDau(c.text);
		let lap = 0;
		for (let k = i - 1; k >= 0 && boDau(sach[k].text) === w; k--) lap++;
		return lap < 3;
	});
};

// Câu Whisper hay tự bịa khi gặp đoạn im lặng (học từ phụ đề YouTube tiếng Việt)
const CAU_BIA = [
	'hay subscribe cho kenh',
	'ghien mi go',
	'de khong bo lo nhung video hap dan',
	'hay dang ky kenh',
	'cam on cac ban da theo doi',
	'la la school',
];

const boCauBia = (phuDe) => {
	const tu = phuDe.map((c) => boDau(c.text));
	const bo = new Set();
	for (const cau of CAU_BIA) {
		const muc = cau.split(' ');
		for (let i = 0; i + muc.length <= tu.length; i++) {
			if (muc.every((m, k) => tu[i + k] === m)) for (let k = 0; k < muc.length; k++) bo.add(i + k);
		}
	}
	return phuDe.filter((_, i) => !bo.has(i));
};

// Khi đã biết chính xác lời đọc: giữ nhịp thời gian của Whisper, thay chữ bằng chữ kịch bản.
// Mỗi chữ kịch bản được đặt theo vị trí ký tự tương ứng trên dòng thời gian Whisper.
const canTheoKichBan = (phuDe, loi) => {
	if (phuDe.length === 0) return phuDe;
	const moc = [];
	let viTri = 0;
	for (const c of phuDe) {
		const dai = Math.max(1, c.text.trim().length);
		moc.push({tu: viTri, den: viTri + dai, startMs: c.startMs, endMs: c.endMs});
		viTri += dai;
	}
	const tongWhisper = viTri;
	const chu = loi.trim().split(/\s+/);
	const tongKichBan = chu.reduce((s, w) => s + w.length, 0);
	const doiThoiGian = (p) => {
		const x = (p / tongKichBan) * tongWhisper;
		const m = moc.find((k) => x <= k.den) ?? moc[moc.length - 1];
		const t = Math.min(1, Math.max(0, (x - m.tu) / (m.den - m.tu)));
		return Math.round(m.startMs + t * (m.endMs - m.startMs));
	};
	let p = 0;
	return chu.map((w, i) => {
		const startMs = doiThoiGian(p);
		p += w.length;
		const endMs = doiThoiGian(p);
		return {text: (i === 0 ? '' : ' ') + w, startMs, endMs, timestampMs: Math.round((startMs + endMs) / 2), confidence: 1};
	});
};

// ---------- Giọng đọc AI ----------

const giongDoc = async (loi, ra, kieu) => {
	if (kieu === 'elevenlabs') {
		const key = process.env.ELEVENLABS_API_KEY;
		if (!key) throw new Error('Thiếu ELEVENLABS_API_KEY trong .env');
		const voice = process.env.ELEVENLABS_VOICE_ID;
		if (!voice) throw new Error('Thiếu ELEVENLABS_VOICE_ID trong .env');
		const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
			method: 'POST',
			headers: {'xi-api-key': key, 'content-type': 'application/json'},
			body: JSON.stringify({text: loi, model_id: process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2', language_code: 'vi'}),
		});
		if (!res.ok) throw new Error(`ElevenLabs lỗi ${res.status}: ${await res.text()}`);
		const mp3 = ra.replace(/\.wav$/, '.mp3');
		writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
		ffmpeg(['-i', mp3, '-ar', '48000', ra]);
	} else if (kieu === 'fpt') {
		const key = process.env.FPT_API_KEY;
		if (!key) throw new Error('Thiếu FPT_API_KEY trong .env');
		const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
			method: 'POST',
			headers: {api_key: key, voice: process.env.FPT_VOICE ?? 'banmai', speed: process.env.FPT_SPEED ?? '0'},
			body: loi,
		});
		const json = await res.json();
		if (json.error !== 0) throw new Error(`FPT.AI lỗi: ${JSON.stringify(json)}`);
		// FPT trả link, file có sau vài giây
		let mp3 = null;
		for (let i = 0; i < 30 && !mp3; i++) {
			await new Promise((r) => setTimeout(r, 2000));
			const f = await fetch(json.async);
			if (f.ok) mp3 = Buffer.from(await f.arrayBuffer());
		}
		if (!mp3) throw new Error('FPT.AI chưa trả file sau 60 giây');
		const f = ra.replace(/\.wav$/, '.mp3');
		writeFileSync(f, mp3);
		ffmpeg(['-i', f, '-ar', '48000', ra]);
	} else {
		// Giọng Linh có sẵn trên macOS — dùng để chạy thử, không dùng cho bản đăng.
		const aiff = ra.replace(/\.wav$/, '.aiff');
		chay('say', ['-v', 'Linh', '-r', '185', '-o', aiff, loi]);
		ffmpeg(['-i', aiff, '-ar', '48000', ra]);
	}
	return thoiLuong(ra);
};

// ---------- Tiện ích ----------

const boDau = (s) =>
	s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Tìm giây bắt đầu của cụm từ trong phụ đề
const timCumTu = (phuDe, cumTu) => {
	const muc = boDau(cumTu).split(' ');
	const tu = phuDe.map((c) => boDau(c.text));
	for (let i = 0; i < tu.length; i++) {
		if (muc.every((m, k) => tu[i + k] === m)) return phuDe[i].startMs / 1000;
	}
	return null;
};

const chepAnh = (nguon, thuMuc, ten) => {
	const duoi = path.extname(nguon).toLowerCase() || '.png';
	const dich = path.join(thuMuc, ten + duoi);
	copyFileSync(path.isAbsolute(nguon) ? nguon : path.join(GOC, nguon), dich);
	return path.relative(path.join(GOC, 'public'), dich).split(path.sep).join('/');
};

// ---------- Hai bước chính ----------

const chuanBi = async (job) => {
	const thuMuc = path.join(GOC, 'public', 'jobs', job.id);
	mkdirSync(thuMuc, {recursive: true});
	const rel = (f) => path.relative(path.join(GOC, 'public'), f).split(path.sep).join('/');
	const cta = job.cta ?? JSON.parse(readFileSync(fileThuongHieu(maThuongHieu(job)), 'utf8')).ctaMacDinh;
	let props;

	if (job.loai === 'quay') {
		console.log('• Sơ chế clip…');
		const clip = path.join(thuMuc, 'clip.mp4');
		const thoiLuongClip = soCheClip(job.clip, clip, job);
		console.log('• Chép lời…');
		const phuDe = await chepLoi(clip, thuMuc);
		const chen = (job.chen ?? []).map((c, i) => {
			let tu = c.giay ?? null;
			if (c.khiNoi) {
				const g = timCumTu(phuDe, c.khiNoi);
				if (g === null) console.log(`  ! Không tìm thấy "${c.khiNoi}" trong lời nói, dùng giây ${tu ?? 0}`);
				else tu = g;
			}
			tu = tu ?? 0;
			return {tuGiay: tu, denGiay: Math.min(tu + (c.giuGiay ?? 3), thoiLuongClip), anh: chepAnh(c.anh, thuMuc, `anh-${i + 1}`), chu: c.chu};
		});
		props = {clip: rel(clip), hook: job.hook, vaiTro: job.vaiTro ?? 'lanh', phuDe, chen, nhan: job.nhan ?? [], cta, thoiLuongClip};
	} else {
		const canh = [];
		for (const [i, c] of job.canh.entries()) {
			console.log(`• Cảnh ${i + 1}/${job.canh.length}: đọc giọng…`);
			const wav = path.join(thuMuc, `giong-${i + 1}.wav`);
			const dai = await giongDoc(c.loi, wav, job.giong ?? 'macos');
			const phuDe = canTheoKichBan(await chepLoi(wav, thuMuc), c.loi);
			canh.push({
				giong: rel(wav),
				thoiLuong: Math.round((dai + 0.35) * 100) / 100,
				chu: c.chu,
				anh: c.anh ? chepAnh(c.anh, thuMuc, `anh-${i + 1}`) : undefined,
				phuDe,
			});
		}
		let nhacNen;
		if (job.nhacNen) nhacNen = chepAnh(job.nhacNen, thuMuc, 'nhac-nen');
		props = {hook: job.hook ?? '', vaiTro: job.vaiTro ?? 'am', canh, cta, nhacNen};
	}

	writeFileSync(path.join(thuMuc, 'props.json'), JSON.stringify(props, null, 2));
	const loi = job.loai === 'quay' ? props.phuDe.map((c) => c.text).join('') : props.canh.map((c) => c.phuDe.map((x) => x.text).join('')).join('\n');
	writeFileSync(path.join(thuMuc, 'phu-de.txt'), loi.trim() + '\n');
	console.log(`\n✓ Xong bước chuẩn bị → public/jobs/${job.id}/props.json`);
	console.log('Lời chép được:\n' + loi.trim());
};

const render = async (job) => {
	const {bundle} = await import('@remotion/bundler');
	const {renderMedia, renderStill, selectComposition} = await import('@remotion/renderer');
	const props = JSON.parse(readFileSync(path.join(GOC, 'public', 'jobs', job.id, 'props.json'), 'utf8'));
	const qa = kiemTra(job, props, docGoiNganh(job));
	const baoCaoQa = baoCao(job, qa);
	console.log(baoCaoQa + '\n');
	if (qa.chan > 0 && !coNgoaiLe(job)) {
		throw new Error(`QA chặn ${qa.chan} chỗ. Sửa phụ đề/kịch bản, hoặc người duyệt ghi "qaNgoaiLe": {"nguoiDuyet", "ngay", "lyDo"} vào job.`);
	}
	const id = job.loai === 'quay' ? 'QuayNoi' : 'DoHoa';
	const thuongHieu = maThuongHieu(job);
	console.log(`• Đóng gói (thương hiệu: ${thuongHieu})…`);
	const serveUrl = await bundle({
		entryPoint: path.join(GOC, 'src', 'index.ts'),
		publicDir: path.join(GOC, 'public'),
		webpackOverride: ganThuongHieu(thuongHieu),
	});
	const composition = await selectComposition({serveUrl, id, inputProps: props, browserExecutable: CHROME, port: CONG});
	// Rule của kênh: video xuất ra phải dài ít nhất 1 phút (job.choPhepNgan: true để bỏ qua khi được đồng ý)
	const giay = composition.durationInFrames / FPS;
	if (giay < TOI_THIEU_GIAY && !job.choPhepNgan) {
		throw new Error(`Video dài ${giay.toFixed(1)}s, dưới mức tối thiểu ${TOI_THIEU_GIAY}s. Thêm đoạn hoặc gộp nội dung trước khi render.`);
	}
	const thuMucRa = path.join(GOC, 'thanh-pham', 'cho-duyet');
	mkdirSync(thuMucRa, {recursive: true});
	const ra = path.join(thuMucRa, `${job.id}.mp4`);
	let truoc = -1;
	await renderMedia({
		composition,
		serveUrl,
		codec: 'h264',
		crf: 18,
		outputLocation: ra,
		inputProps: props,
		browserExecutable: CHROME,
		port: CONG,
		onProgress: ({progress}) => {
			const p = Math.floor(progress * 10);
			if (p !== truoc) {
				truoc = p;
				process.stdout.write(`  render ${p * 10}%\n`);
			}
		},
	});
	writeFileSync(path.join(thuMucRa, `${job.id}.qa.txt`), baoCaoQa + '\n');
	await renderStill({composition, serveUrl, output: path.join(thuMucRa, `${job.id}.jpg`), frame: Math.round(1.2 * FPS), inputProps: props, imageFormat: 'jpeg', browserExecutable: CHROME, port: CONG});
	console.log(`\n✓ Thành phẩm: thanh-pham/cho-duyet/${job.id}.mp4 (${(composition.durationInFrames / FPS).toFixed(1)}s)`);
};

// ---------- Chạy ----------

const [buoc, fileJob] = process.argv.slice(2);
if (!['chuan-bi', 'render', 'tat-ca', 'qa'].includes(buoc) || !fileJob) {
	console.log('Dùng: node pipeline/san-xuat.mjs <chuan-bi|render|tat-ca|qa> kich-ban/<id>.json');
	process.exit(1);
}
const job = JSON.parse(readFileSync(path.resolve(fileJob), 'utf8'));
if (buoc === 'qa') {
	// Có props (đã chuẩn bị) thì quét chữ thật lên video, chưa có thì quét kịch bản
	const fProps = path.join(GOC, 'public', 'jobs', job.id, 'props.json');
	const props = existsSync(fProps) ? JSON.parse(readFileSync(fProps, 'utf8')) : null;
	const qa = kiemTra(job, props, docGoiNganh(job));
	console.log(baoCao(job, qa));
	process.exit(qa.chan > 0 && !coNgoaiLe(job) ? 2 : 0);
}
if (buoc !== 'render') {
	// Quét sớm trên kịch bản để sửa trước khi tốn thời gian chép lời; chưa chặn ở bước này
	const qa = kiemTra(job, null, docGoiNganh(job));
	if (qa.loi.length) console.log(baoCao(job, qa) + '\n');
	await chuanBi(job);
}
if (buoc !== 'chuan-bi') await render(job);

// Cài phần không nằm trong git: kiểm tra công cụ hệ thống, tạo .env, tải whisper.cpp + model.
//   npm install && npm run cai-dat
import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {downloadWhisperModel, installWhisperCpp} from '@remotion/install-whisper-cpp';
import {GOC, WHISPER, WHISPER_MODEL, WHISPER_VERSION} from '../pipeline/cau-hinh.mjs';

const co = (lenh) => spawnSync(lenh, ['-version'], {stdio: 'ignore'}).status === 0;
let thieu = false;

const [chinh] = process.versions.node.split('.').map(Number);
if (chinh < 20) {
	console.log(`✗ Cần Node 20 trở lên (đang có ${process.versions.node})`);
	thieu = true;
}
for (const lenh of ['ffmpeg', 'ffprobe']) {
	if (co(lenh)) console.log(`✓ ${lenh}`);
	else {
		console.log(`✗ Thiếu ${lenh}. macOS: brew install ffmpeg`);
		thieu = true;
	}
}

if (!existsSync(path.join(GOC, '.env'))) {
	copyFileSync(path.join(GOC, '.env.example'), path.join(GOC, '.env'));
	console.log('✓ Tạo .env từ .env.example (điền khoá giọng đọc nếu dùng video đồ hoạ)');
}

const fileModel = path.join(WHISPER, `ggml-${WHISPER_MODEL}.bin`);
if (existsSync(path.join(WHISPER, 'main')) || existsSync(path.join(WHISPER, 'build', 'bin', 'whisper-cli'))) {
	console.log(`✓ whisper.cpp ở ${WHISPER}`);
} else {
	console.log(`• Cài whisper.cpp ${WHISPER_VERSION} vào ${WHISPER} (cần Xcode Command Line Tools, vài phút)…`);
	await installWhisperCpp({to: WHISPER, version: WHISPER_VERSION, printOutput: true});
}
if (existsSync(fileModel)) console.log(`✓ Model ${WHISPER_MODEL}`);
else {
	console.log(`• Tải model ${WHISPER_MODEL} (~1,6 GB)…`);
	await downloadWhisperModel({model: WHISPER_MODEL, folder: WHISPER});
}

console.log(thieu ? '\nCòn thiếu công cụ ở trên, cài xong chạy lại.' : '\n✓ Sẵn sàng. Thử: npm run san-xuat -- tat-ca kich-ban/vi-du/vi-du-dohoa.json');
process.exit(thieu ? 1 : 0);

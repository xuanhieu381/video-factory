// Kiểm tra QA từ cấm và cấu hình thương hiệu / gói ngành. Chạy: npm test
import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import yaml from 'js-yaml';
import {GOC} from '../pipeline/cau-hinh.mjs';
import {docGoiNganh, kiemTra} from '../pipeline/qa.mjs';

const suc = yaml.load(readFileSync(path.join(GOC, 'goi-nganh/suc-khoe/nganh.yaml'), 'utf8'));
const job = (them) => ({id: 't', creativeId: 'T-01', pillar: 'P2', function: 'Educate', ...them});
const loi = (kq, muc) => kq.loi.filter((l) => l.muc === muc).map((l) => l.cum ?? l.lyDo);

test('kịch bản sạch không có lỗi', () => {
	const kq = kiemTra(job({hook: 'Một phút nhìn lại tư thế ngồi', kichBan: 'Bạn có thể bắt đầu từ một việc nhỏ.'}), null, suc);
	assert.equal(kq.loi.length, 0);
});

test('chặn tuyên bố chữa khỏi và hứa kết quả tức thì', () => {
	const kq = kiemTra(job({hook: 'Chỉ cần 60 giây là chữa khỏi đau lưng', kichBan: 'Hiệu quả 100%!'}), null, suc);
	assert.equal(kq.chan, 2);
	assert.deepEqual(loi(kq, 'chan'), ['chỉ cần 60 giây là chữa', 'hiệu quả 100']);
});

test('câu phủ định hạ lỗi chặn thành cảnh báo', () => {
	const kq = kiemTra(job({kichBan: 'Đây không phải là phương pháp chữa bệnh.'}), null, suc);
	assert.equal(kq.chan, 0);
	assert.deepEqual(loi(kq, 'canh-bao'), ['chữa bệnh']);
});

test('phủ định không vượt qua dấu câu', () => {
	const kq = kiemTra(job({kichBan: 'Không thay thế thuốc. Bạn không cần bác sĩ nữa đâu.'}), null, suc);
	assert.deepEqual(loi(kq, 'chan'), ['không cần bác sĩ']);
});

test('quét chữ thật lên video khi đã có props', () => {
	const props = {hook: 'Hook sạch', phuDe: [{text: 'Em'}, {text: ' khỏi'}, {text: ' bệnh'}], chen: [], cta: {chu: 'Theo dõi'}};
	const kq = kiemTra(job({kichBan: 'Kịch bản sạch'}), props, suc);
	assert.deepEqual(loi(kq, 'chan'), ['khỏi bệnh']);
});

test('P4 cần giấy đồng ý đã ký', () => {
	const thieu = kiemTra(job({pillar: 'P4'}), null, suc);
	const mieng = kiemTra(job({pillar: 'P4', consentStatus: 'dong-y-mieng'}), null, suc);
	const ky = kiemTra(job({pillar: 'P4', consentStatus: 'da-ky'}), null, suc);
	assert.equal(thieu.canhBao, 1);
	assert.equal(mieng.canhBao, 1);
	assert.equal(ky.loi.length, 0);
});

test('mọi gói ngành đọc được và luật hợp lệ', () => {
	for (const ma of readdirSync(path.join(GOC, 'goi-nganh')).filter((d) => !d.startsWith('.'))) {
		const goi = yaml.load(readFileSync(path.join(GOC, 'goi-nganh', ma, 'nganh.yaml'), 'utf8'));
		assert.equal(goi.ma, ma, `goi-nganh/${ma}: "ma" phải trùng tên thư mục`);
		for (const luat of goi.tuCam) {
			assert.ok(['chan', 'canh-bao'].includes(luat.muc), `${ma}: muc "${luat.muc}"`);
			assert.ok(luat.cum || luat.mau, `${ma}: luật "${luat.lyDo}" thiếu cum/mau`);
			if (luat.mau) new RegExp(luat.mau, 'u');
		}
	}
});

test('mọi thương hiệu đủ file và trỏ đúng gói ngành', () => {
	for (const ma of readdirSync(path.join(GOC, 'public/thuong-hieu')).filter((d) => !d.startsWith('.'))) {
		const thuMuc = path.join(GOC, 'public/thuong-hieu', ma);
		const th = JSON.parse(readFileSync(path.join(thuMuc, 'thuong-hieu.json'), 'utf8'));
		assert.equal(th.ma, ma, `thuong-hieu/${ma}: "ma" phải trùng tên thư mục`);
		assert.ok(existsSync(path.join(thuMuc, th.logo)), `${ma}: thiếu logo ${th.logo}`);
		if (th.bieuTuong) assert.ok(existsSync(path.join(thuMuc, th.bieuTuong)), `${ma}: thiếu ${th.bieuTuong}`);
		if (th.outro === 'video') assert.ok(th.outroVideo && existsSync(path.join(thuMuc, th.outroVideo)), `${ma}: outro "video" cần file outroVideo`);
		for (const k of ['chinh', 'chinhDam', 'noiBat', 'nen', 'trang', 'den', 'nenMoDauCuoi', 'nenManKetCuoi', 'phuDeDangNoi', 'phuDeDangNoiNong']) {
			assert.match(th.mau[k] ?? '', /^#[0-9A-Fa-f]{6}$/, `${ma}: màu "${k}"`);
		}
		assert.ok(docGoiNganh({thuongHieu: ma}), `${ma}: chưa gắn gói ngành`);
	}
});

// QA tuân thủ trước khi render: quét chữ trong video theo từ cấm của gói ngành.
// Chỉ lọc sớm, không thay người duyệt chuyên môn và pháp chế.
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {GOC} from './cau-hinh.mjs';
import {fileThuongHieu, maThuongHieu} from './thuong-hieu.mjs';


export const docGoiNganh = (job) => {
	const thuongHieu = JSON.parse(readFileSync(fileThuongHieu(maThuongHieu(job)), 'utf8'));
	const ma = job.nganh ?? thuongHieu.nganh;
	if (!ma) return null;
	const f = path.join(GOC, 'goi-nganh', ma, 'nganh.yaml');
	if (!existsSync(f)) throw new Error(`Không có gói ngành "${ma}" (goi-nganh/${ma}/nganh.yaml)`);
	return yaml.load(readFileSync(f, 'utf8'));
};

// Chữ thường, giữ dấu, bỏ dấu câu → mảng âm tiết
const tachAmTiet = (s) =>
	s
		.normalize('NFC')
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);

// Chữ thật sự lên video: có props (sau chuẩn bị) thì lấy từ props, chưa có thì lấy từ kịch bản
const layNguon = (job, props) => {
	const nguon = [];
	const them = (ten, chu) => chu && nguon.push({ten, chu});
	const p = props ?? job;
	them('Hook', p.hook);
	if (props) {
		if (props.phuDe) them('Lời nói (phụ đề)', props.phuDe.map((c) => c.text).join(''));
		(props.canh ?? []).forEach((c, i) => {
			them(`Cảnh ${i + 1}: chữ lớn`, c.chu);
			them(`Cảnh ${i + 1}: lời đọc`, c.phuDe.map((x) => x.text).join(''));
		});
	} else {
		them('Kịch bản', job.kichBan);
		(job.canh ?? []).forEach((c, i) => {
			them(`Cảnh ${i + 1}: chữ lớn`, c.chu);
			them(`Cảnh ${i + 1}: lời đọc`, c.loi);
		});
	}
	(p.chen ?? []).forEach((c) => them('Chữ trên ảnh chèn', c.chu));
	(p.nhan ?? []).forEach((n) => them('Nhãn chữ', n.chu));
	them('CTA', p.cta?.chu);
	them('CTA dòng phụ', p.cta?.phu);
	return nguon;
};

// vế câu của từng âm tiết: xét phủ định không vượt qua dấu câu
const danhSoVe = (chu) => chu.split(/[.!?;:,\n…]+/u).flatMap((ve, i) => tachAmTiet(ve).map(() => i));

const timTrongNguon = (luat, amTiet, ve) => {
	const trung = [];
	const biPhuDinh = (i) => {
		const tu = Math.max(0, i - 5, ve.indexOf(ve[i]));
		const truoc = amTiet.slice(tu, i).join(' ');
		return (luat.boQuaKhiTruoc ?? []).some((w) => ` ${truoc} `.includes(` ${w} `));
	};
	for (const cum of luat.cum ?? []) {
		const muc = tachAmTiet(String(cum));
		for (let i = 0; i + muc.length <= amTiet.length; i++) {
			if (muc.every((m, k) => amTiet[i + k] === m)) trung.push({tu: i, den: i + muc.length, phuDinh: biPhuDinh(i)});
		}
	}
	if (luat.mau) {
		// Chạy regex trên chuỗi âm tiết, đổi vị trí ký tự về vị trí âm tiết
		const chuoi = amTiet.join(' ');
		for (const m of chuoi.matchAll(new RegExp(luat.mau, 'gu'))) {
			const tu = chuoi.slice(0, m.index).split(' ').length - 1;
			const den = tu + m[0].split(' ').length;
			trung.push({tu, den, phuDinh: biPhuDinh(tu)});
		}
	}
	return trung;
};

export const kiemTra = (job, props, goi) => {
	const loi = [];
	if (!goi) return {goi: null, loi, chan: 0, canhBao: 0};

	for (const truong of goi.truongBatBuoc ?? []) {
		if (!job[truong]) loi.push({muc: 'canh-bao', nguon: 'Thông tin Creative', lyDo: `Thiếu trường "${truong}"`});
	}
	for (const [truong, hopLe] of Object.entries(goi.giaTriHopLe ?? {})) {
		if (job[truong] && !hopLe.includes(job[truong])) loi.push({muc: 'canh-bao', nguon: 'Thông tin Creative', lyDo: `"${truong}": "${job[truong]}" không thuộc ${hopLe.join(', ')}`});
	}
	for (const truong of goi.truongTheoTruCot?.[job.pillar] ?? []) {
		if (!job[truong]) loi.push({muc: 'canh-bao', nguon: 'Thông tin Creative', lyDo: `Trụ cột ${job.pillar} cần trường "${truong}" (vd. giấy đồng ý của nhân vật)`});
		else if (goi.yeuCauGiaTri?.[truong] && !goi.yeuCauGiaTri[truong].includes(job[truong])) {
			loi.push({muc: 'canh-bao', nguon: 'Thông tin Creative', lyDo: `"${truong}": "${job[truong]}" chưa đạt, cần ${goi.yeuCauGiaTri[truong].join(' hoặc ')}`});
		}
	}

	for (const {ten, chu} of layNguon(job, props)) {
		const amTiet = tachAmTiet(chu);
		const ve = danhSoVe(chu);
		// Lỗi "chặn" xét trước, cụm dài trước; cụm đã bị một luật bắt thì luật khác không bắt chồng lên
		// Câu phủ định: lỗi "chặn" hạ thành cảnh báo để người duyệt xem lại, lỗi "cảnh báo" thì bỏ qua
		const ung = goi.tuCam
			.flatMap((luat) => timTrongNguon(luat, amTiet, ve).map((t) => ({...t, luat, muc: t.phuDinh ? 'canh-bao' : luat.muc})))
			.filter((u) => !(u.phuDinh && u.luat.muc !== 'chan'))
			.sort((a, b) => (a.muc === 'chan' ? 0 : 1) - (b.muc === 'chan' ? 0 : 1) || b.den - b.tu - (a.den - a.tu));
		const daNhan = [];
		for (const u of ung) {
			if (daNhan.some((d) => u.tu < d.den && d.tu < u.den)) continue;
			daNhan.push(u);
			const nguCanh = amTiet.slice(Math.max(0, u.tu - 5), u.den + 5).join(' ');
			const lyDo = u.phuDinh ? `${u.luat.lyDo} (câu có vẻ đang phủ định, xem lại)` : u.luat.lyDo;
			loi.push({muc: u.muc, nguon: ten, cum: amTiet.slice(u.tu, u.den).join(' '), nguCanh, lyDo, goiY: u.luat.goiY});
		}
	}
	return {goi, loi, chan: loi.filter((l) => l.muc === 'chan').length, canhBao: loi.filter((l) => l.muc === 'canh-bao').length};
};

export const baoCao = (job, kq) => {
	const dong = [`QA tuân thủ · ${job.id}${job.creativeId ? ` · ${job.creativeId}` : ''}`];
	if (!kq.goi) return [...dong, '! Thương hiệu chưa gắn gói ngành: không quét từ cấm.'].join('\n');
	dong.push(`Gói ngành: ${kq.goi.ten} (mức rủi ro ${kq.goi.mucRuiRo}) · ${kq.chan} chặn · ${kq.canhBao} cảnh báo`);
	for (const l of kq.loi) {
		dong.push('', `[${l.muc === 'chan' ? 'CHẶN' : 'CẢNH BÁO'}] ${l.nguon}: ${l.lyDo}`);
		if (l.cum) dong.push(`  «…${l.nguCanh}…»  ← "${l.cum}"`);
		if (l.goiY) dong.push(`  Gợi ý: ${l.goiY}`);
	}
	if (job.qaNgoaiLe) dong.push('', `Ngoại lệ đã ghi: ${job.qaNgoaiLe.nguoiDuyet} · ${job.qaNgoaiLe.ngay} · ${job.qaNgoaiLe.lyDo ?? ''}`);
	dong.push('', 'Báo cáo này chỉ lọc sớm theo từ khoá, không thay duyệt chuyên môn và pháp chế.');
	return dong.join('\n');
};

// Ngoại lệ chỉ hợp lệ khi ghi rõ người duyệt và ngày
export const coNgoaiLe = (job) => Boolean(job.qaNgoaiLe?.nguoiDuyet && job.qaNgoaiLe?.ngay);

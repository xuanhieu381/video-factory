---
name: video-factory
description: Sản xuất video dọc 9:16 từ kịch bản bằng repo Video Factory (Remotion + FFmpeg + whisper.cpp), cho bất kỳ thương hiệu nào có trong public/thuong-hieu/. Người dùng dán kịch bản, Claude viết lệnh sản xuất, chạy dây chuyền (cắt lặng, chuẩn âm, phụ đề tiếng Việt, giọng AI, ảnh chèn, outro, QA từ cấm theo gói ngành) và trả MP4 vào thanh-pham/cho-duyet/. Dùng khi nghe «làm video», «dựng video từ kịch bản», «đây là kịch bản», «thêm thương hiệu», «thêm gói ngành».
---

# Video Factory

Luồng: **kịch bản → `kich-ban/<id>.json` → `chuan-bi` → Claude soát phụ đề → `render` (có QA) → `thanh-pham/cho-duyet/`.**
Nhà máy **không tự đăng**: mọi thành phẩm dừng ở chờ duyệt; người duyệt của thương hiệu quyết định phát hành.

Mọi lệnh chạy ở gốc repo. Lần đầu: `npm install && npm run cai-dat`.

## 1. Đọc kịch bản, chọn loại video

- Có clip quay → `"loai": "quay"` (mẫu QuayNoi). Không có clip → `"loai": "dohoa"` (chữ động + ảnh + giọng AI).
- Thương hiệu: `"thuongHieu": "<ma>"` (thư mục trong `public/thuong-hieu/`). Không ghi thì dùng `THUONG_HIEU` trong `.env`, rồi tới `mau`. Không rõ thương hiệu nào → hỏi, đừng đoán.
- Vai trò nội dung: `lanh` (nhận ra vấn đề), `am` (hiểu cách làm), `nong` (lời mời, màu nhấn `noiBat`).
- Thiếu thông tin quyết định (clip nào, CTA gì) → hỏi 1 câu ngắn.

## 2. Viết lệnh sản xuất `kich-ban/<id>.json`

`id`: `YYYY-MM-DD-ten-ngan-khong-dau`. Ghi thêm thông tin Creative: `creativeId`, `pillar` (P1–P4), `function` (Educate/Inspire).

Video quay:
```json
{
  "id": "2026-10-20-vi-sao-da-kho",
  "thuongHieu": "<ma>",
  "creativeId": "...", "pillar": "P2", "function": "Educate",
  "loai": "quay",
  "vaiTro": "lanh",
  "hook": "Câu hook ≤ 12 chữ hiện 3 giây đầu",
  "kichBan": "toàn văn kịch bản, để soát phụ đề",
  "clip": "nguon/<file>.mp4",
  "cat": {"tu": 0, "den": null},
  "catLang": true,
  "chen": [{"khiNoi": "toner", "giuGiay": 3, "anh": "/đường/dẫn/anh.png", "chu": "Tên sản phẩm"}],
  "cta": {"chu": "...", "phu": "..."}
}
```
- `chen[].khiNoi`: ảnh bật lên đúng lúc nói cụm đó (so khớp không dấu); dùng `"giay"` thay thế được.
- `cat`: chỉ lấy một đoạn của clip dài (giây trên clip gốc). Bỏ `cta` thì dùng `ctaMacDinh` của thương hiệu.

Video đồ hoạ: xem `kich-ban/vi-du/vi-du-dohoa.json`. Mỗi cảnh 1 ý, `loi` 1–2 câu, `chu` ≤ 8 chữ.
Giọng: `macos` (chỉ chạy thử) · `fpt` (`FPT_API_KEY`) · `elevenlabs` (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`). Khoá để trong `.env`; không bao giờ in khoá ra chat.

## 3. Chuẩn bị

```bash
npm run san-xuat -- chuan-bi kich-ban/<id>.json
```
In lời chép được, ghi `public/jobs/<id>/props.json`, và quét sớm từ cấm trên kịch bản. Clip dài: chạy nền.

## 4. Soát phụ đề (bắt buộc)

So `phuDe[].text` trong `props.json` với kịch bản: sửa chính tả, tên riêng, dấu tiếng Việt. Chỉ sửa `text`, giữ nguyên `startMs/endMs/timestampMs` và dấu cách đầu mỗi chữ. `chen` báo `! Không tìm thấy` thì sửa `tuGiay/denGiay`.

**Độ dài tối thiểu 60 giây** (tính cả outro, hằng `TOI_THIEU_GIAY`). Không đủ lời dùng được thì báo và đề xuất gộp. Chỉ bỏ qua khi người dùng đồng ý: `"choPhepNgan": true` + `"ghiChuNgan"`.

## 5. Render (có QA tuân thủ)

```bash
npm run san-xuat -- render kich-ban/<id>.json
npm run qa -- kich-ban/<id>.json        # chỉ chạy QA
```
QA quét mọi chữ lên video theo `tuCam` của gói ngành (`goi-nganh/<nganh>/nganh.yaml`, gắn qua `"nganh"` trong `thuong-hieu.json`):
- **CHẶN** → render dừng. Sửa phụ đề/kịch bản. Chỉ khi người duyệt đồng ý giữ nguyên mới ghi `"qaNgoaiLe": {"nguoiDuyet", "ngay", "lyDo"}`. **Claude không tự ghi ngoại lệ.**
- **CẢNH BÁO** → vẫn render, báo cáo ở `thanh-pham/cho-duyet/<id>.qa.txt`; nêu lại khi trả video.
- Trụ cột P4 (người thật) cần `"consentStatus": "da-ky"` kèm `consentGhiChu`. Chỉ ghi `da-ky` khi người dùng xác nhận đã ký văn bản.

Ra `<id>.mp4` + `<id>.jpg` + `<id>.qa.txt`. Xem thumbnail và vài khung hình (ffmpeg -ss) trước khi báo; nói rõ thời lượng và chỗ cần xem lại.

## Thêm thương hiệu

`cp -R public/thuong-hieu/mau public/thuong-hieu/<ma>`, sửa `ma` (trùng tên thư mục), `nganh`, màu (đủ 10 khoá), logo, `ctaMacDinh`. Outro: `"logo"` (logo phóng nhẹ) hoặc `"video"` kèm `"outroVideo": "outro.mp4"` (mp4 dọc 1080×1920, 3,5 giây, xem `mau-am`). Font khác Be Vietnam Pro: thêm vào bảng `FONT` trong `src/brand.ts`. Không viết cứng màu/logo vào component. Chạy `npm test` để kiểm.

## Thêm gói ngành

`cp -R goi-nganh/chung goi-nganh/<ma>`, viết lại trụ cột, lằn ranh đỏ, `tuCam`. `goi-nganh/suc-khoe` là ví dụ đầy đủ. Sửa luật xong: `npm test` và chạy `qa` trên mọi job trong `kich-ban/` để chắc không phát sinh chặn nhầm. Gói ngành mới phải được pháp chế xác nhận trước khi dùng cho khách thật.

## Whisper tiếng Việt hay sai

- "thận" → "thật", "tạng" → "tặng"; tên tiếng Anh (toner, serum…) dễ sai.
- Tiếng vỗ, thở, nhạc: có thể lặp chữ hoặc bịa câu ("Hãy subscribe cho kênh…"). Pipeline lọc lặp > 3 lần và câu trong `CAU_BIA`; gặp câu bịa mới thì thêm vào.
- Video đồ hoạ: phụ đề lấy từ `loi`, Whisper chỉ lấy nhịp.

## Lưu ý

- Logo, outro, ảnh và clip của một thương hiệu thật là tài sản của thương hiệu đó: chỉ đưa vào git khi chủ thương hiệu đồng ý, và không đẩy lên repo công khai.
- Remotion cần giấy phép thương mại cho công ty trên 3 người.
- Không dùng video của người khác làm nguồn đăng lại. Không thêm claim mà kịch bản không có.

# Video Factory

**Nhà máy video dọc 9:16 cho nhiều thương hiệu: dán kịch bản → MP4 chờ duyệt.**

Dây chuyền tự cắt khoảng lặng, chuẩn âm lượng, chép phụ đề tiếng Việt, lồng giọng AI, chèn ảnh, gắn bộ nhận diện thương hiệu, và **quét từ cấm theo ngành** trước khi xuất.
Nhà máy không tự đăng bài: mọi thành phẩm dừng ở `thanh-pham/cho-duyet/` để người duyệt quyết định.

Dựng bằng [Remotion](https://www.remotion.dev) (React), FFmpeg và [whisper.cpp](https://github.com/ggml-org/whisper.cpp).

> *English:* a Vietnamese-first short-video factory. Paste a script, get a branded vertical MP4 with karaoke subtitles, AI voice-over and an industry-specific compliance check, waiting for human approval. Brands and industry rule packs are plain JSON/YAML folders.

| Thương hiệu `mau` · gói `chung` · outro logo | Thương hiệu `mau-am` · gói `suc-khoe` · outro video |
|---|---|
| Xanh dương, Be Vietnam Pro | Màu ấm, Montserrat |

## Cài đặt

Cần: Node 20 trở lên, FFmpeg (`brew install ffmpeg` / `apt install ffmpeg`), công cụ build C++ (macOS: Xcode Command Line Tools) để dựng whisper.cpp.

```bash
git clone <repo> video-factory && cd video-factory
npm install
npm run cai-dat
```

`cai-dat` kiểm tra FFmpeg, tạo `.env` từ `.env.example`, rồi tải whisper.cpp kèm model `large-v3-turbo` (khoảng 1,6 GB) vào `./whisper.cpp`. Máy đã có whisper.cpp thì đặt `WHISPER_DIR` trong `.env`.

Chạy thử hai video mẫu (giọng đọc có sẵn của macOS):

```bash
npm run san-xuat -- tat-ca kich-ban/vi-du/vi-du-dohoa.json
npm run san-xuat -- tat-ca kich-ban/vi-du/vi-du-dohoa-am.json
```

Không dùng macOS: đặt `"giong": "fpt"` hoặc `"elevenlabs"` và điền khoá trong `.env`.

## Cách dùng

| Lệnh | Việc |
|---|---|
| `npm run san-xuat -- chuan-bi kich-ban/<id>.json` | Sơ chế clip hoặc đọc giọng, chép lời → `public/jobs/<id>/props.json` |
| *(soát phụ đề trong `props.json`)* | Sửa chính tả, giữ nguyên mốc thời gian |
| `npm run san-xuat -- render kich-ban/<id>.json` | QA từ cấm → `thanh-pham/cho-duyet/<id>.mp4` + `.jpg` + `.qa.txt` |
| `npm run san-xuat -- tat-ca kich-ban/<id>.json` | Chuẩn bị rồi render luôn |
| `npm run qa -- kich-ban/<id>.json` | Chỉ chạy QA |
| `npm run studio` | Xem trước trong Remotion Studio (`THUONG_HIEU=<ma> npm run studio`) |
| `npm run kiem-tra` | Typecheck + test |

Hai loại video:

- **`quay`**: người thật nói trước camera. Clip được cắt lặng, chuẩn âm, chép phụ đề; ảnh chèn bật lên đúng lúc nói một cụm từ (`chen[].khiNoi`).
- **`dohoa`**: chữ động + ảnh + giọng AI, không cần quay.

Cấu trúc lệnh sản xuất xem `kich-ban/vi-du/` và `.claude/skills/video-factory/SKILL.md`. Mở repo bằng [Claude Code](https://claude.com/claude-code) thì skill `video-factory` có sẵn: chỉ cần dán kịch bản.

## Ba lớp

| Lớp | Ở đâu | Đổi khi nào |
|---|---|---|
| **Động cơ** | `src/`, `pipeline/`, `scripts/` | Không đổi theo khách |
| **Gói ngành** | `goi-nganh/<ma>/nganh.yaml` | Mỗi ngành một lần: trụ cột nội dung, lằn ranh đỏ, từ cấm, người duyệt, mức rủi ro |
| **Thương hiệu** | `public/thuong-hieu/<ma>/` | Mỗi khách một thư mục: màu, font, logo, outro, CTA mặc định, gói ngành |

### Thêm thương hiệu

```bash
cp -R public/thuong-hieu/mau public/thuong-hieu/<ma>
```

Sửa `thuong-hieu.json`:

| Trường | Ý nghĩa |
|---|---|
| `ma` | Trùng tên thư mục |
| `nganh` | Gói ngành dùng cho QA (`chung`, `suc-khoe`, …) |
| `font` | `BeVietnamPro` hoặc `Montserrat`; font Google khác thì thêm vào bảng `FONT` trong `src/brand.ts` |
| `mau` | 10 màu theo vai trò: `chinh`, `chinhDam`, `noiBat` (màu nhấn), `nen`, `trang`, `den`, hai màu nền chuyển, hai màu chữ phụ đề đang đọc |
| `logo`, `bieuTuong` | File trong thư mục thương hiệu (PNG/SVG); `bieuTuong` là icon nhỏ ở màn mở đầu, mặc định dùng logo |
| `outro` | `"logo"` (logo phóng nhẹ) hoặc `"video"` kèm `"outroVideo": "outro.mp4"` (mp4 dọc 1080×1920, 3,5 giây) |
| `ctaMacDinh` | CTA ở cuối khi kịch bản không ghi |

Chạy `npm test` để kiểm file thương hiệu đủ và đúng.

> Logo, outro và clip của một thương hiệu thật là tài sản của thương hiệu đó. Nếu repo của bạn công khai, đừng commit chúng; giữ ở repo riêng tư hoặc thêm thư mục đó vào `.gitignore`.

### Thêm gói ngành

```bash
cp -R goi-nganh/chung goi-nganh/<ma>
```

Viết lại trụ cột, lằn ranh đỏ và `tuCam`. `goi-nganh/suc-khoe` là ví dụ đầy đủ cho ngành rủi ro cao. Chạy `npm test` và QA trên các kịch bản có sẵn.

**Gói ngành đi kèm chỉ để tham khảo, không phải tư vấn pháp lý.** Danh sách từ cấm phải được pháp chế của bạn xác nhận trước khi dùng thật.

## QA tuân thủ

`render` quét mọi chữ thật sự lên video (hook, phụ đề, chữ lớn, nhãn, CTA) theo `tuCam` của gói ngành:

- **CHẶN**: render dừng. Chỉ chạy tiếp khi người duyệt ghi `"qaNgoaiLe": {"nguoiDuyet", "ngay", "lyDo"}` vào job.
- **CẢNH BÁO**: vẫn render; báo cáo `<id>.qa.txt` nằm cạnh MP4 để người duyệt soát.
- Câu phủ định (*«không phải là phương pháp chữa bệnh»*) hạ lỗi chặn thành cảnh báo; chỉ xét trong cùng vế câu.
- Trụ cột P4 (câu chuyện người thật) cần `"consentStatus": "da-ky"`, tức nhân vật đã ký đồng ý.

QA lọc theo từ khoá, **không thay người duyệt chuyên môn và pháp chế**.

## Cấu hình máy (`.env`)

| Biến | Dùng khi |
|---|---|
| `THUONG_HIEU` | Thương hiệu mặc định khi job không ghi `thuongHieu` (mặc định `mau`) |
| `FPT_API_KEY`, `FPT_VOICE` | Giọng FPT.AI |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Giọng ElevenLabs |
| `WHISPER_DIR` | whisper.cpp đã cài ở chỗ khác |
| `CHROME_HEADLESS` | Repo nằm trên ổ không có symlink (exFAT): Remotion không tải Chrome vào `node_modules` được, cần trỏ tới Chrome headless ở ổ khác |
| `REMOTION_RENDER_PORT` | Đổi cổng server render (mặc định 3910) |

## Thư mục

```
├── .claude/skills/video-factory/   skill cho Claude Code
├── .github/workflows/              CI: typecheck, test, QA kịch bản
├── goi-nganh/                      gói ngành (YAML): chung, suc-khoe
├── kich-ban/                       lệnh sản xuất (JSON); vi-du/ là mẫu
├── nguon/                          clip nguồn (không đưa lên git)
├── pipeline/                       san-xuat, qa, thuong-hieu, cau-hinh
├── public/thuong-hieu/             bộ nhận diện: mau, mau-am
├── scripts/cai-dat.mjs             cài whisper.cpp, tạo .env
├── src/                            mẫu video Remotion (QuayNoi, DoHoa) và thành phần
├── test/                           test QA và cấu hình
└── thanh-pham/cho-duyet/           thành phẩm chờ duyệt (không đưa lên git)
```

## Giấy phép

Mã nguồn theo giấy phép [MIT](LICENSE).

**Remotion không thuộc giấy phép MIT**: công ty trên 3 người cần mua giấy phép Remotion để dùng ([remotion.dev/license](https://www.remotion.dev/license)). Kiểm tra cả điều khoản dùng thương mại của dịch vụ giọng đọc bạn chọn.

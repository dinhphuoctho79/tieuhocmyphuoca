# V5 LITE — HƯỚNG DẪN CÀI ĐẶT

Bản này được tối ưu cho mục đích hưởng ứng phong trào:

- Không framework.
- Không npm.
- Không database.
- Không Supabase.
- Không PHP.
- Chỉ HTML + CSS + JavaScript.
- Chạy trên GitHub Pages, Vercel, Netlify hoặc hosting cPanel.
- Ảnh người dùng xử lý ngay trên thiết bị.

## Cách 1 — Vercel

1. Giải nén source.
2. Upload toàn bộ lên GitHub.
3. Vercel → Add New Project → Import repository.
4. Framework Preset: **Other**.
5. Không cần Build Command.
6. Không cần Output Directory.
7. Deploy.

## Cách 2 — Hosting cPanel

1. Mở File Manager.
2. Vào `public_html`.
3. Upload toàn bộ nội dung source.
4. Mở tên miền.

Không cần tạo database.

## Cách 3 — GitHub Pages

1. Upload source lên GitHub.
2. Settings → Pages.
3. Deploy from branch.
4. Chọn `main` và `/root`.

## Thêm khung mới

1. PNG vào:
`assets/frames/`

2. Thumbnail WebP vào:
`assets/thumbs/`

3. Mở `frames.json` và thêm:

```json
{
  "id": "khung-02",
  "name": "Khung 02",
  "image": "assets/frames/khung-02.png",
  "thumbnail": "assets/thumbs/khung-02.webp",
  "active": true,
  "safeArea": {
    "x": 0.5,
    "y": 0.47,
    "radius": 0.30
  }
}
```

## Thay thông tin trường

Sửa ngay trong `frames.json`:

```json
"site": {
  "school": "TRƯỜNG TIỂU HỌC MỸ PHƯỚC A",
  "owner": "ỦY BAN NHÂN DÂN XÃ MỸ PHƯỚC · THÀNH PHỐ CẦN THƠ",
  "campaign": "Khung avatar hưởng ứng phong trào"
}
```

## Tối ưu ảnh khung

Khuyến nghị:
- PNG khung: 1024 hoặc 2048 px.
- Thumbnail: WebP 300–400 px.
- Vùng giữa PNG phải trong suốt.
- Không nhúng ảnh nền lớn không cần thiết.

## Vì sao bản này nhẹ hơn V4?

V4 cần Vite + Supabase + Authentication + database.

V5 Lite tải trực tiếp:
- 1 HTML
- 1 CSS
- 1 JS
- `frames.json`
- logo
- khung đang sử dụng

Preview chỉ render 768×768 để thao tác mượt.
Khi tải ảnh mới render 1024 hoặc 2048 nên ảnh xuất vẫn rõ.

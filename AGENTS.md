# Đảo Đèn Lồng

Dùng Node 22.12+, `npm ci`, `npm run dev`, `npm run verify`. Giao diện và CLI dùng cùng `src/game.js`. Mọi giá trị tuning đọc từ `game.contract.json`.

Sau khi sửa mô phỏng, chạy cùng seed, scenario và inputs hai lần, so JSONL. Kiểm tra snapshot 0, tick của event, frame giữ trạng thái, dòng end và mã thoát 2 của file sai. Chạy lại đường đi thắng trong `scenarios/restore-island.json`. Sau khi sửa giao diện, build rồi chạy `node scripts/browser-check.js` để thử cả hai nút chơi lại. Chỉ đánh dấu phase sau khi đối chiếu ticket và lưu bằng chứng thật tương ứng.

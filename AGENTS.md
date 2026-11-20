# Đảo Đèn Lồng

Dùng Node 22.12+. Chạy npm ci, npm run verify và node scripts/verify-phase3.js. Giữ đồng bộ cả ba bản đồ giữa src/islands.js, mô phỏng và renderer. Đối chiếu thứ tự tick, sim_tick khi pause, lịch sinh và tuning trước khi sửa gameplay. Sau khi build, chạy scripts/browser-check.js và scripts/check-campaign.js bằng Node để xác minh FPS, cài đặt, chuỗi ba Đêm và tổng điểm. Chỉ ghi bằng chứng đã chạy thật. Giữ tag của phase trước.
Sau thay đổi về đèn, kiểm lại thứ tự hao dầu, tương tác và xét bình minh, gồm biên 30 dầu và ưu tiên hết lửa. Không coi thắp hết đèn là thắng sớm.

Phase 4: kiểm tra benchmark bằng cửa sổ thật, soak trong một tiến trình, xuất bảng điểm sau khi khởi động lại. Chạy scripts/check-release.js sau khi có bench.json và soak.json. Mọi số đo trong bằng chứng phải đến từ lệnh đã chạy.

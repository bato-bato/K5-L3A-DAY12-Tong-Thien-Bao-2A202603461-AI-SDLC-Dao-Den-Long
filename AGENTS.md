# Đảo Đèn Lồng

Dùng Node 22.12+. Chạy npm ci, npm run verify và node scripts/verify-phase2.js. Giữ đồng bộ cả ba bản đồ giữa src/islands.js, mô phỏng và renderer. Đối chiếu thứ tự tick, sim_tick khi pause, lịch sinh và tuning trước khi sửa gameplay. Sau khi build, chạy scripts/browser-check.js và scripts/check-campaign.js bằng Node để xác minh FPS, cài đặt, chuỗi ba Đêm và tổng điểm. Chỉ ghi bằng chứng đã chạy thật. Giữ tag của phase trước.

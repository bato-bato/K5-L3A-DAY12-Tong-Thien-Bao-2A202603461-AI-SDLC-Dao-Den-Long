# Ticket-02 · Tiêu chí nghiệm thu và kết quả

| Mục | Hành vi cần thấy | Bằng chứng |
| --- | --- | --- |
| Gió Lạc | Đêm 2–3 xuất hiện theo lịch, đuổi khi đủ đom đóm, cướp một lần, bỏ chạy. Xung sáng có thể lấy lại số bị cướp. | Các ca steal, flee, spawns |
| Bùa Gió | Nhặt C1/C2, hiệu lực 600 tick, chạy 7,2 m/s, lướt lại sau khi nhả phím, bùa xuất hiện lại sau 2700 tick. | Ca charm |
| Chuỗi ba Đêm | Menu, lời Ông Đăng, chơi, kết quả, Đêm kế tiếp, Bình Minh cộng đúng ba điểm thắng. Thua cho chơi lại cùng Đêm. | campaign.json, ảnh night-1 đến night-3 và dawn |
| Tạm dừng | Tick ngoài tiếp tục, thời gian gameplay, hồi chiêu và thực thể đứng yên. | Ca pause và browser.json |
| Cài đặt | Mức âm lượng và độ nhạy chuột giữ nguyên sau reload. | browser.json |
| Âm thanh | Có nền đêm và âm báo nhặt, thắp, xung, trúng đòn, nhảy, lướt, thắng/thua, sinh Bóng Mực, đếm ngược. | Bộ điều khiển Web Audio trong src/main.js. Chưa đánh giá chất lượng bằng tai. |
| HUD | Hiện lửa, giờ, đèn, điểm, túi 10 ô, hồi chiêu, nhắc nạp và hướng tới đèn ngoài khung. | playing.jpg, night-1.jpg, mã HUD |
| Màu và sáng | Renderer khai báo màu theo bảng ticket, cường độ ambient bằng 0,15 + 0,55 × tỷ lệ đèn sáng. | src/world.js, ảnh ba Đêm |

[Kịch bản](../scenarios/phase2/cases.json) · [Kết quả](proof/phase2/) · [Kiểm thử giá trị biên](../test/phase2.test.js).

14 ca hồi quy giữ các hành vi cũ còn hiệu lực. Đã đổi các kỳ vọng bị ticket thay thế về sức chứa, giá nạp, điểm khi nạp, sát thương và xung 3D. Đường đi cũ được thay bằng replay theo đúng tọa độ mới. Đêm 1 và 2 có lượt thắng từ bản đồ mặc định. Kiểm tra chuỗi giao diện đặt đèn cuối ở 9/10 mỗi Đêm rồi bấm E thật. Chưa ghi nhận lượt thắng Đêm 3 từ đầu trên bản đồ mặc định.

Các giả định triển khai gồm Bóng Mực mới ở trạng thái spawning trong 60 tick; điểm xuất phát Đêm 3 là (0,0,30) ở chân đảo ngoài tháp; điểm sinh Gió Lạc dùng các điểm sương ở rìa đảo. Lệnh đo headless giữ quái và gió, cấp 400 lửa trong scenario đo để không kết thúc trước 21.600 tick. Tệp headless-win32.json ghi cấu hình và thời gian từng Đêm. FPS đo bằng timestamp requestAnimationFrame, không thay đồng hồ.

Codex đọc ticket từ ảnh, triển khai và tái sử dụng mô phỏng cho CLI và giao diện. Khi ca qua cầu lệch 6,2 m, kiểm tra log cho thấy bùa trên cầu đã tăng tốc. Ca đo cầu được tách khỏi ca nhận bùa. Ước lượng token hoặc chi phí toàn phiên chưa có số liệu từ tài khoản.

# Retro · Từ một hòn đảo đến bản phát hành

## Bốn lần đánh giá

| Phase | Điều kiểm chứng được | Điều học được |
|---|---|---|
| 1 | Lệnh headless và game dùng cùng mô phỏng. Replay Windows và Ubuntu có cùng SHA-256. | Bản thử của AI từng đòi đủ ba đom đóm mới cho nạp. Đối chiếu PRD rồi thử với một con đã phát hiện sai khác. |
| 2 | Dùng bản đồ chuẩn, input theo tick và kịch bản riêng để thử cầu, bục nhảy, gió, bùa, tạm dừng, chuyển Đêm. | Ca thử cầu từng lệch 6,2 m vì Mây nhặt bùa tăng tốc. Tách bùa khỏi kịch bản đo cầu giúp khoanh đúng nguyên nhân. |
| 3 | Ca biên cho dầu đúng 30, đèn cạn trước tương tác, nhiều Bóng hút và hết lửa ở bình minh. | Khi thiết kế thay đổi, một replay thắng sớm trở thành kỳ vọng sai. Cập nhật kỳ vọng cùng ADR và giữ lại tag cũ để tra cứu. |
| 4 | Đo khung thật bằng Chrome, RSS thật qua 10 Đêm, thử phím trùng, mở lại game và xuất điểm. | Bộ kiểm thử mô phỏng xanh vẫn chưa đủ. Trình duyệt phát hiện menu chữ lớn bị footer che nút. Lần soak mặc định của Node tăng RSS từ 37,95 lên 47,98 MB, vượt ngưỡng dù cả 10 Đêm kết thúc bình thường. |

## Làm việc với AI

Phần có ích nhất của AGENTS.md là yêu cầu dùng cùng thứ tự tick, giữ tag cũ và chỉ lưu bằng chứng từ lần chạy thật. Điều đó cho phép thay nhân vật và rừng thông nhiều lần mà vẫn chạy lại được cùng một ca bình minh. Headless giúp kiểm trường hợp rất khó thao tác bằng tay. Chuỗi qua menu thật bổ sung góc nhìn khác, gồm focus, phím tắt, chữ lớn và lưu dữ liệu sau khi đóng tiến trình.

Đánh giá hình ảnh vẫn cần người chơi. Người tuyết nón lá được chọn sau khi học viên xem bản nhân vật hệ sét. Một lần benchmark trước đây chỉ đo FPS của gameplay trong vài giây. Ticket phát hành yêu cầu cảnh đông thực thể, tải ban đầu và 1% low. Việc tách riêng hai phép đo tránh dùng kết quả của cảnh nhẹ làm số phát hành. Trong soak, dùng V8 không JIT và vùng nhớ ngắn hạn nhỏ để giảm RSS; cùng lệnh này có trong manifest để người chấm tái lập.

## Token, chi phí và lần làm lại

Không có bảng usage hoặc hóa đơn của bốn phase. Ước lượng từ sản phẩm tại thời điểm phát hành: khoảng 111 nghìn ký tự trong src, scripts và test, tương đương khoảng 28–37 nghìn token văn bản theo hệ số 3–4 ký tự/token. Đây là ước lượng phần hiện còn. Với giả định tổng input, bản nháp, sửa lại và kết quả công cụ bằng 3–6 lần lượng văn bản đó, toàn dự án có thể ở mức **84–222 nghìn token**. Hệ số này là giả định phục vụ retro, độ bất định cao. Chi phí tiền phụ thuộc gói tài khoản, model, cache và tỷ lệ input/output; chưa có dữ liệu để suy ra số tiền thực trả.

Giữ logic chung cho UI và CLI, dùng scenario vài tick để thử ranh giới, tái dùng harness đã có và chỉ đọc phần mã liên quan giúp bớt ngữ cảnh lặp. Nếu làm lại, nên lưu usage theo từng phase ngay từ đầu, chạy thử bảng điểm từ bản ZIP và đưa ca chữ lớn vào kiểm thử giao diện trước khi chốt bố cục. Ngưỡng FPS của giảng viên và test ẩn chỉ được xác nhận ở môi trường chấm.

[Bằng chứng Phase 1](development.md) · [Phase 2](phase2.md) · [Phase 3](phase3.md) · [Phase 4](proof/phase4/)

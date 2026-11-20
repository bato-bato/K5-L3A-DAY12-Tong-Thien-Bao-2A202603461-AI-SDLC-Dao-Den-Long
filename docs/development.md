# Ghi chép phát triển

## Phạm vi và tiêu chí nghiệm thu

Nguồn đã đọc gồm README, GUIDE, CHECKPOINTS, RULES, RUBRIC và SUBMISSION trong bản clone. Lab Board yêu cầu xác minh trình duyệt khi truy cập. Chưa có nội dung PRD-0, Test Contract hay Ticket-02/03/04 để đối chiếu. Đây là bản chơi dựa trên mô tả chung. Các kịch bản JSON trong repo là kịch bản nội bộ.

| Hành vi theo mô tả chung | Cách kiểm chứng |
| --- | --- |
| Chơi dưới góc nhìn thứ ba | Mở game trên Chrome, điều khiển Mây và xem camera đi theo nhân vật. Xem ảnh và video. |
| Nhặt đom đóm | Đi vào vùng nhặt, kiểm tra số lượng tăng một lần. |
| Thắp Đèn Lồng Lớn | Đem đom đóm đến đèn, kích hoạt rồi so túi đồ và trạng thái đèn. |
| Né Bóng Mực | Kiểm tra sát thương, khoảng bảo vệ khi hồi sinh và trạng thái kết thúc. |
| Khả năng chơi đến cuối | Chạy `scenarios/restore-island.json` từ trạng thái ban đầu bằng lệnh headless. |
| Chạy lại cùng đầu vào | So hai kết quả từ cùng một kịch bản và chạy bộ test. |

## Giả định thiết kế hiện tại

Đảo có ba đèn, mỗi đèn cần ba đom đóm. Mây có ba lượt sức lực, thu nhặt khi đến gần, bấm E để thắp. Khi trúng Bóng Mực, Mây quay về bến, giữ đồ đã thu và tạm miễn sát thương. Mất hết sức thì thua, thắp hết đèn thì thắng. Logic chạy 60 bước mỗi giây. Hằng số, vị trí đèn và đom đóm ở `src/game.js`. Các con số này do người triển khai chọn trong thời gian chờ tài liệu bài tập.

## Nhật ký sử dụng AI

Codex đọc tài liệu, dựng scene Three.js, viết mô phỏng, CLI, test và kiểm tra trên Chrome. Cảnh, nhân vật và hiệu ứng tạo bằng mã. Ngữ cảnh dùng chung cho giao diện và CLI là một module luật duy nhất. Hướng dẫn thường trực ở `AGENTS.md`, kịch bản kiểm tra giao diện ở `scripts/browser-check.js`. Không có số đo token/chi phí thực tế hay phân bổ theo bốn phase cho phiên này. Không đủ dữ liệu để đưa ra ước tính đáng tin cậy theo phase.

## Đánh giá bản chơi

Bộ kiểm tra đã phát hiện vấn đề lúc khởi chạy Vite trong môi trường Windows có giới hạn truy cập. Dùng bộ đọc cấu hình native của Vite và bỏ tiền biên dịch riêng đối với Three.js. Bộ kiểm tra trình duyệt đi qua nút bắt đầu, trợ giúp, bàn phím, HUD, thắp đèn, tạm dừng và tiếp tục. Hai kịch bản headless kiểm tra mốc thắp đèn đầu tiên và một lượt thắng hoàn chỉnh. Tệp bằng chứng lưu đầu ra khi chạy thật.

Để chốt từng phase, cần đối chiếu luật, định dạng tệp, tên lệnh và đầu ra với ticket thực tế, bổ sung test cho chỗ khác biệt, rồi gắn tag vào phiên bản thực sự đã kiểm chứng. Việc chạy trên máy chấm macOS/Linux và điểm test ẩn chưa được xác minh.

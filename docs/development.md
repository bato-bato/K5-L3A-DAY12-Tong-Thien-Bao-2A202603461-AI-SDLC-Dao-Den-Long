# Phase 1 · Đêm 1, Đảo Bến

## Yêu cầu và cách kiểm tra

Nguồn là sáu tài liệu trong repo và ảnh PRD-0 cùng Test Contract v1.0 do học viên cung cấp. Phiên bản trước dùng ba đèn, Bóng Mực tuần tra và định dạng replay tự chọn. Phase 1 thay bằng năm đèn, AI truy đuổi, vùng an toàn, nạp từng phần, tỏa sáng, điểm, đồng hồ và CLI JSONL. Các kịch bản cũ đã được viết lại bằng frames chính thức.

| Yêu cầu | Cách tái lập và bằng chứng |
| --- | --- |
| Chơi Đêm 1 từ đầu đến thắng/thua, chơi lại | Chạy `node scripts/browser-check.js` sau khi build. Bộ kiểm tra điều khiển bản HTML offline bằng bàn phím, không sửa trạng thái game. [Thắng](proof/won.jpg) · [Thua](proof/lost.jpg) · [Video](demo/demo.mp4) |
| Gom, giới hạn túi, nạp gần đèn, năm đèn | Chạy replay mặc định trong README. Log giữ từng lần nhặt, nạp, thắp và kết quả. [JSONL](proof/night1.jsonl) |
| Tỏa sáng, giá, bán kính, đẩy, choáng, hồi chiêu | Test các mép bán kính và thao tác giữ nút. Scenario riêng đặt S7 trong vùng tác động. [Log](proof/pulse.jsonl) · [Ảnh](proof/pulse.jpg) |
| Truy đuổi, mất lửa, miễn sát thương, sợ đèn sáng, bình minh | Các ca riêng trong bộ test đối chiếu vị trí, số lửa, tick và lý do kết thúc. [Kết quả](proof/tests.txt) |
| CLI, input thưa, yaw, tick, đầu ra tất định | Bài test chạy CLI trong process riêng, so byte của hai file, kiểm tra mã thoát 2, stderr và bảo toàn output cũ khi input lỗi. [Test CLI](../test/cli.test.js) |
| HUD, mũ và đèn treo, đảo sáng dần | HUD hiển thị đèn, túi, lửa, thời gian và điểm. Ảnh chụp từ Chrome. [Ảnh đầu đêm](proof/menu.jpg) · [Đèn đầu tiên](proof/first-lantern.jpg) |

## Giả định của Phase 1

- Mây bắt đầu tại (0,0,0). Bản đồ có bờ chắn ở bán kính 39 m. `fall_enabled=false` và `hit_drop_ratio=0`. Nhảy thể hiện chiều cao. Khoảng cách tương tác, truy đuổi và va chạm dùng mặt XZ theo contract.
- Mỗi tick xử lý điều khiển, di chuyển, nhặt, nạp, tỏa sáng, rồi xét thắng. Khi còn đèn tắt, mô phỏng xử lý Bóng Mực và điều kiện thua, sau đó mới sinh thêm thực thể. Nếu nhiều đèn trong tầm, ưu tiên đèn tắt gần nhất, khi bằng khoảng cách thì chọn ID theo thứ tự danh sách.
- Tỏa sáng trừ chi phí cả khi không có mục tiêu. Mây có thể ở nguyên tại chỗ sau khi bị chạm, vùng sáng bảo vệ Mây khỏi sát thương. Quy tắc điểm và các con số ở README và manifest.
- Đường đom đóm dẫn về các đèn giúp người chơi định hướng. Thực thể sinh thêm dùng PRNG theo seed. Danh sách trong scenario thay danh sách ban đầu. Hai cờ random điều khiển việc sinh thêm. Nạp scenario không phát event hay cộng điểm.
- Nếu thắng ở cùng bước với bình minh, ưu tiên thắng. Thưởng thời gian dùng phần giây nguyên. Scenario có `time_left_s` dùng nó làm thời gian còn lại ở tick 0.
- Nền đảo ở Y=0. Chế độ CLI chỉ nạp mô phỏng, không khởi tạo Three.js, cửa sổ hay âm thanh.

## Nhật ký AI và đánh giá

Học viên cung cấp đề Phase 1 sau khi hoàn thành bản thử. Codex đọc các ảnh, so từng mục với bản thử, thay luật, thêm test tại biên và chạy lại bằng thao tác bàn phím. Một sai khác thực tế là bản thử yêu cầu túi đủ ba con mới cho nạp và cho Bóng Mực đi tuần. Bản hiện tại kiểm thử trường hợp nạp đúng một con và dùng khoảng cách mỗi tick để kiểm tra truy đuổi.

Để tiết kiệm token, giữ lại renderer và công cụ kiểm tra trình duyệt. Dùng một module luật và một nguồn tuning cho cả hai đường chạy. Riêng năm tệp luật, CLI và test chính có khoảng 22.449 ký tự, tương đương khoảng 5.600–7.500 token đầu ra nếu ước theo 3–4 ký tự/token. Đây là ước lượng cho phần mã đó. Tổng token đầu vào, các lần chạy công cụ và chi phí tài khoản chưa có số liệu.

Kiểm thử theo thời gian cố định giúp phân biệt tick đọc input với tick phát sự kiện. Bài học cho phase tiếp theo là viết trước các ca cho những quy tắc mới và chạy lại bộ chứng cứ còn hiệu lực sau mỗi thay đổi. Các ticket sau Phase 1 và kết quả test ẩn thuộc phần giảng viên công bố riêng.

Bản sao sạch đã cài phụ thuộc và build trên Ubuntu 24.04 (WSL), Node 22.14.0. Cả Windows và Ubuntu chạy đạt 14/14 test. Hai tệp JSONL của lượt thắng có cùng SHA-256. [Log Linux và mã băm](proof/linux.txt).

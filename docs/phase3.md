# ADR 03 · Dầu và bình minh

Đèn lưu lượng dầu bằng đơn vị 1/60 để phép trừ 1 hoặc 5 mỗi bước mô phỏng chính xác. Trạng thái đã từng thắp độc lập với trạng thái đang sáng. Counter của người chơi chỉ tăng khi tự thắp trong Đêm. Scenario đặt sẵn đèn sáng không tăng sức chứa. Từng Bóng đang hút đóng góp lượng riêng vào bước trừ dầu đầu tick. Mỗi 60 bước hút liên tục có sự kiện ghi nhận.

Sau hao hụt, đèn cạn tắt trước tương tác, nên người chơi có thể thắp lại trong cùng tick. Tính kết quả sau va chạm ở bước cuối, ưu tiên hết lửa rồi mới xét ngưỡng sáng. Điểm thưởng dùng dầu thực ở tick bình minh.

## Changelog · Các thay đổi phá vỡ tương thích

- v1.1 thắng ngay khi tất cả đèn sáng. v1.2 xét ngưỡng 60% lúc bình minh, thay all_lit bằng dawn_survived. Ba thời lượng thành 240/270/300 giây.
- Đèn sáng nhận dầu, đèn yếu mất vùng bảo vệ. Snapshot thêm fuel, ever_lit, relit_count và capacity. Sự kiện thắp đèn thêm relight. Hút, hết dầu và châm dầu có sự kiện riêng.
- Điểm nạp còn 5 mỗi con, có thưởng thắp lại, đánh Bóng đang hút và dầu còn lại. Bỏ thưởng thời gian. Sức chứa tăng dần.
- Đã cập nhật test thắp đèn thứ năm, giới hạn thời gian, điểm tick cuối và điều kiện của replay cũ. Không còn dùng thắng sớm làm tiêu chí cho replay. Các ca v1.1 nguyên bản ở tag phase-2.
- Nhân vật chibi 3D lấy cảm hứng từ tranh học viên cung cấp, dùng tóc trắng điểm đỏ, giáp đen đỏ, găng tay tích điện và nón gắn đèn. Các tia điện chỉ là hiệu ứng hiển thị. Cài đặt màu được lưu trong localStorage.

## Tái lập

Chạy npm run verify, sau đó chạy node scripts/browser-check.js và node scripts/check-campaign.js. Bộ kiểm thử bao gồm dầu cạn đúng tick, nhiều Bóng hút, châm vượt ngưỡng, điểm xung, thắp lại, sức chứa, tạm dừng, ba ngưỡng bình minh và ưu tiên mất lửa. Kiểm tra chuyển cảnh dùng scenario gần bình minh; xem log và ảnh trong docs/proof/phase3.

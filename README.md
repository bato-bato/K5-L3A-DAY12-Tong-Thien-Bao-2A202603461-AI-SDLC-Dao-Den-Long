# Đảo Đèn Lồng

[Video demo MP4](docs/demo/demo.mp4) · [Bản chơi offline](docs/demo/choi-ngay.html) · [Bản web ZIP](docs/demo/dao-den-long-web.zip)

**Phase 1 · Đêm 1, Đảo Bến.** Mây có năm phút và ba ngọn lửa để thắp năm Đèn Lồng Lớn trên đảo. Gom đom đóm, chọn giữa nạp đèn và tỏa sáng, rồi tìm đường về vùng sáng an toàn.

## Chơi trên máy

Tải `docs/demo/choi-ngay.html` về máy, mở bằng Chrome hoặc Edge rồi chọn **Vào đảo**. Để chạy từ mã nguồn trên Windows, Linux hoặc macOS, dùng Node.js 22.12 trở lên, chạy hai lệnh dưới đây trong repo rồi mở địa chỉ mà Vite in ra.

```sh
npm ci
npm run dev
```

| Thao tác | Điều khiển |
| --- | --- |
| Đi, nhảy | WASD / các phím mũi tên, Space để nhảy. |
| Gom đom đóm | Đến gần, túi mang tối đa 6 con. |
| Nạp đèn | Nhấn E khi ở gần. Có thể nạp nhiều lần, mỗi đèn sáng khi nhận đủ 3 con. |
| Tỏa sáng | Nhấn F để dùng 1 con, đẩy lùi và làm choáng Bóng Mực trong 6 m. |
| Tạm dừng, chơi lại | Esc để tạm dừng. Màn kết quả có nút chơi lại. Màn hình cảm ứng có nút riêng. |

Bóng Mực đuổi Mây. Chạm một lần làm mất một lửa và cho Mây hai giây miễn sát thương. Vùng 3 m quanh đèn đã thắp là nơi trú. Thắng khi cả năm đèn sáng. Hết lửa hoặc đến bình minh thì thua.

**Điểm** cộng 10 cho mỗi đom đóm nhặt được, 100 cho mỗi đèn mới thắp và 15 cho mỗi Bóng Mực trúng xung sáng. Khi thắng, cộng 2 cho mỗi giây nguyên còn lại và 50 cho mỗi lửa đang giữ. Các tham số máy chấm đọc nằm trong [game.contract.json](game.contract.json).

## Chạy Test Contract v1.0

Lệnh sau phát lại một lượt đi hết Đảo Bến trên bản đồ mặc định, ghi JSONL vào đường dẫn chỉ định. Node chạy mô phỏng độc lập với DOM và GPU.

```sh
node scripts/headless.js --seed 12 --night 1 --inputs scenarios/restore-island.json --ticks 18000 --out night1.jsonl --snapshot-every 60
```

Có thể bỏ `--inputs` để nhân vật đứng yên và bỏ `--scenario` để dùng bản đồ mặc định. `--snapshot-every` mặc định là 10. Ví dụ riêng để kiểm tra xung sáng và thời gian choáng:

```sh
node scripts/headless.js --seed 12 --night 1 --scenario scenarios/pulse.json --inputs scenarios/pulse-inputs.json --ticks 150 --out pulse.jsonl
```

`npm run verify` chạy test và build. `node scripts/browser-check.js` mở bản HTML offline trong Chrome, điều khiển bằng bàn phím và tái tạo bằng chứng giao diện. [Log lượt thắng](docs/proof/night1.jsonl) · [Log xung sáng](docs/proof/pulse.jsonl) · [Kết quả test](docs/proof/tests.txt) · [Giả định, đánh giá và nhật ký AI](docs/development.md).

## Sáng tạo của tôi

Mây đội nón lá có chiếc đèn nhỏ treo trên vành. Đảo có cầu gỗ, biển mây và đèn giấy treo bên bến. Mỗi đèn được thắp sẽ xuất hiện quầng sáng và làm cảnh đêm sáng thêm. Màn hình và âm thanh đọc trạng thái từ cùng mô phỏng với CLI. [Ảnh đầu đêm](docs/proof/menu.jpg) · [Ảnh chiến thắng](docs/proof/won.jpg) · [Nguồn và giấy phép](CREDITS.md).

---

# Day 12 — AI SDLC: Đảo Đèn Lồng

> **Cá nhân** (1 người / 1 MSSV) · Áp dụng SDLC cùng AI để xây một **game 3D** qua **4 phase**, từ yêu cầu ban đầu tới bản phát hành.
> **Lab board + trợ giảng:** **[Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)**

---

## Tài liệu của lab

| File | Nội dung |
|---|---|
| [GUIDE.md](GUIDE.md) | Hướng dẫn làm lab: vòng làm việc mỗi phase, harness, kiểm chứng, token |
| [CHECKPOINTS.md](CHECKPOINTS.md) | Các mốc tự kiểm tra từ chuẩn bị đến nộp bài |
| [SUBMISSION.md](SUBMISSION.md) | Đặt tên repo, hạn nộp, tag, Release, video, checklist |
| [RULES.md](RULES.md) | Quy định: AI, trung thực về bằng chứng, bản quyền, bảo mật |
| [RUBRIC.md](RUBRIC.md) | Thang điểm chi tiết |

## Lab board

Yêu cầu dự án được phát hành tại **[Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)**. Mỗi phase là một tab (tab chưa phát hành bị khóa), mỗi tab có trợ giảng AI riêng chỉ trả lời trong phạm vi phase đó. Trợ giảng cần đăng nhập claude.ai và dùng lượt Claude của bạn.

## Dự án

**Đảo Đèn Lồng**: game 3D góc nhìn thứ ba. Mây, người giữ đèn nhỏ tuổi, gom đom đóm để thắp lại các Đèn Lồng Lớn và né Bóng Mực trong sương đen.

- Không ràng buộc công nghệ; chạy được trên macOS hoặc Linux.
- Tuân theo **Test Contract** (chế độ headless) để được chấm tự động và so sánh với nhau.

| Phase | Bạn nhận | Nộp |
|---|---|---|
| 1 | **PRD-0** (mô tả tổng quát) + Test Contract | tag `phase-1` |
| 2 | **Ticket-02**, phát hành khi Phase 1 kết thúc | tag `phase-2` |
| 3 | **Ticket-03**, phát hành khi Phase 2 kết thúc | tag `phase-3` |
| 4 | **Ticket-04**, phát hành khi Phase 3 kết thúc | tag `phase-4` + Release `v1.0.0` |

Yêu cầu sẽ được bổ sung và có thể thay đổi giữa các phase, giống dự án thật.

### Lịch 4 giờ

Bài lab kéo dài **4 giờ**. Phase 1 và 2 khoảng **1 giờ**, Phase 3 khoảng **30 phút**, Phase 4 khoảng **1 giờ 30 phút**. Mỗi phase phát hành đúng mốc giờ. Phase mới xuất hiện trên lab board khi tới mốc.

| Mốc | Sự kiện | Hạn tag |
|---|---|---|
| 0h | Phát hành **Phase 1** (PRD-0), gồm cả phần chuẩn bị | `phase-1` trước mốc 1h |
| 1h | Phát hành **Phase 2** | `phase-2` trước mốc 2h |
| 2h | Phát hành **Phase 3** | `phase-3` trước mốc 2h30 |
| 2h30 | Phát hành **Phase 4** | `phase-4`, Release `v1.0.0` và video trước mốc 4h |
| 4h | Hết giờ lab, chốt bài | |

Hết giờ mỗi phase thì tag và chuyển sang phase tiếp theo, dù phase chưa hoàn hảo. Chỗ chưa xong ghi trung thực trong bằng chứng.

---

## Gợi ý SDLC (cách làm là của bạn)

Mỗi phase là một vòng nhỏ. Công cụ, thứ tự, định dạng tài liệu đều tự do; đây chỉ là gợi ý:

1. **Requirements:** biến yêu cầu thành tiêu chí nghiệm thu kiểm chứng được. Chỗ mơ hồ thì tự giả định và ghi lại.
2. **Plan:** nghĩ cách kiểm chứng **trước** khi để agent viết code.
3. **Build:** để agent viết, bạn điều phối và review.
4. **Verify:** chạy thật, kiểm tra hành vi thật. *Không có bằng chứng thì chưa xong*: "agent bảo chạy rồi" không phải bằng chứng.
5. **Evaluate:** cái gì đạt, AI sai ở đâu, harness (AGENTS.md, skill, hook) cần chỉnh gì.
6. **Release:** gắn tag.

## Ba điều cần nhớ

> Bạn được **tự do sáng tạo thêm** quanh phần lõi (nhân vật, cơ chế nhỏ, câu chuyện, hiệu ứng, âm thanh…). Sáng tạo gọn và không phá yêu cầu được tính điểm trong hạng mục F của [RUBRIC](RUBRIC.md); ghi mục "Sáng tạo của tôi" trong README của bạn.

- **Game tốt là game đúng yêu cầu của khách hàng**, không phải game phức tạp hay đẹp nhất. Làm đúng và chứng minh được là đúng trước, trau chuốt sau.
- **Cân nhắc kỹ quota token của bạn.** Đốt nhiều token không làm bài tốt hơn. Ngữ cảnh gọn, kế hoạch rõ, kiểm chứng sớm thường vừa rẻ vừa đúng hơn chạy agent liên tục.
- **Kiểm chứng là phần quan trọng nhất.** Bằng chứng (test, output headless, ảnh, số đo) đáng giá hơn lời mô tả.

---

## Bàn giao cuối cùng

Một **repo GitHub cá nhân, public**, gồm:

1. **Toàn bộ mã nguồn** của game qua 4 phase, tag `phase-1` … `phase-4`, Release `v1.0.0`.
2. **Video demo `.mp4` dưới 5 phút** (đính kèm Release `v1.0.0` hoặc `docs/demo/demo.mp4`, link ở đầu README): chơi thử và cho thấy bằng chứng game chạy đúng.
3. **Bằng chứng kiểm chứng** của từng phase (định dạng tự chọn).
4. **Harness AI đã dùng** (AGENTS.md / CLAUDE.md, skills, hooks, plugins…), giữ nguyên trong repo và lịch sử git.
5. **Ghi chép ngắn:** spec/giả định mỗi phase, nhật ký dùng AI (gồm token/chi phí ước tính), retro.

Không commit API key, token hay `.env`. Gửi link repo theo hướng dẫn của Coach.

## Đánh giá (100 điểm)

| Hạng mục | Điểm |
|---|---|
| Test tự động ẩn (headless, gồm kiểm tra lại phase trước) | 30 |
| Kiểm chứng & bằng chứng của bạn | 20 |
| Quy trình SDLC & harness AI | 15 |
| Evaluation & retro (gồm cách bạn dùng token) | 10 |
| Hiệu năng & ổn định | 10 |
| Chất lượng sản phẩm (đúng yêu cầu, chơi được) | 10 |
| Video demo | 5 |

## Quy định

- Dùng AI thoải mái; không sao chép repo của người khác.
- Bằng chứng phải thật: test luôn đạt hay output sửa tay là vi phạm.
- Nhân vật, bối cảnh là bản gốc của lab; asset bên ngoài chỉ dùng loại CC0/CC-BY/MIT hoặc tự tạo, ghi nguồn trong `CREDITS.md`.

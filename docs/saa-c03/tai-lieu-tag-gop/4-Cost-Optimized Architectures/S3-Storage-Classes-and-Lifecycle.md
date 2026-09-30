# Lớp lưu trữ S3 và Lifecycle: Intelligent-Tiering và Glacier

> **Domain:** Cost-Optimized Architectures (exam Domain 4). Tag: S3-Storage-Classes-and-Lifecycle (Intelligent-Tiering / Glacier). Chọn đúng lớp lưu trữ S3 và đúng cơ chế chuyển tầng để giảm tiền lưu trữ theo vòng đời dữ liệu.
> **Mức độ ra đề:** Rất cao. Đề luôn là bài toán kinh tế ghép bốn yếu tố: tần suất truy cập, thời gian lưu, thời gian chấp nhận chờ lấy dữ liệu, và kích thước hoặc số lượng object. Bẫy chính là các chi phí ẩn: thời gian lưu tối thiểu, kích thước tính phí tối thiểu, phí truy xuất, phí chuyển tầng và phí giám sát.
> **Cross-reference:** Amazon S3, Network-Costs, Cost-Visibility-and-Governance, AWS-Backup, AWS-Glue-Amazon-Athena.

## 1. Tổng quan: lớp lưu trữ S3 và Lifecycle giải quyết vấn đề gì

Dữ liệu mới tạo thường được đọc rất nhiều, nhưng sau 30, 60 hay 90 ngày thì gần như không ai mở lại, trong khi hồ sơ tài chính hay bệnh án lại bắt buộc phải giữ 7 đến 10 năm. Để tất cả ở S3 Standard là lãng phí, còn đẩy sai sang lớp rẻ thì bị phạt khi xóa sớm hoặc khi đọc lại. S3 là Object Storage có độ bền thiết kế 11 số 9, dữ liệu nằm ở tối thiểu 3 AZ (trừ các lớp One Zone), object từ 0 byte đến 5 TB, mỗi lần PUT đơn tối đa 5 GB. Hóa đơn S3 không chỉ là tiền dung lượng theo GB-tháng mà còn gồm phí request (lớp càng lạnh càng đắt), phí truy xuất theo GB (có ở IA và họ Glacier, không có ở Standard và Intelligent-Tiering), phí chuyển tầng của Lifecycle tính trên mỗi 1,000 object, phí giám sát của Intelligent-Tiering tính theo số object, và phí truyền dữ liệu ra Internet.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Storage Class** | Mỗi lớp có giá lưu, phí truy xuất, số AZ và thời gian lấy dữ liệu khác nhau | Chọn đúng lớp ngay khi ghi nếu biết rõ tính chất dữ liệu |
| **S3 Lifecycle Policy** | Quy tắc tĩnh theo **tuổi object**: chuyển tầng (Transition) hoặc xóa (Expiration) | Tự động hóa khi **biết trước** lúc nào dữ liệu nguội |
| **S3 Intelligent-Tiering** | Lớp lưu trữ tự theo dõi **hành vi truy cập thực tế** của từng object rồi tự chuyển tầng | Dùng khi **không đoán trước** được pattern, không phí truy xuất |
| **Họ S3 Glacier** | Ba lớp lưu kho: Instant Retrieval, Flexible Retrieval, Deep Archive | Trạm cuối cho dữ liệu lưu kho, backup, tuân thủ pháp lý |

> **Một câu định vị:** biết rõ timeline dữ liệu nguội đi => **Lifecycle Policy**. Pattern truy cập không đoán trước, thay đổi liên tục => **Intelligent-Tiering**. Lưu kho nhưng cần lấy trong mili-giây => **Glacier Instant Retrieval**. Chờ được vài phút đến vài giờ => **Glacier Flexible Retrieval**. Rẻ nhất tuyệt đối, chờ 12 đến 48 giờ => **Glacier Deep Archive**. Dữ liệu chỉ sống dưới 30 ngày => cứ để **S3 Standard**. Chỉ muốn gợi ý mà không tự chuyển tầng => **S3 Storage Class Analysis**.

## 2. Bảng tổng hợp các lớp lưu trữ

| Lớp | Truy cập điển hình | Số AZ | Lưu tối thiểu | Kích thước tính phí tối thiểu | Phí truy xuất | Thời gian truy xuất |
|-----|--------------------|-------|---------------|-------------------------------|---------------|---------------------|
| **Standard** | Thường xuyên | ≥ 3 | Không | Không | Không | Mili-giây |
| **Intelligent-Tiering** | Không rõ, biến động | ≥ 3 | Không | Object < 128 KB không được chuyển tầng, luôn tính giá Standard | Không (có phí giám sát theo object) | Mili-giây; 3 đến 5 giờ hoặc tối đa 12 giờ nếu bật tầng Archive tùy chọn |
| **Standard-IA** | Khoảng 1 lần/tháng, cần lấy ngay | ≥ 3 | **30 ngày** | **128 KB** | Có | Mili-giây |
| **One Zone-IA** | Ít truy cập, dữ liệu tái tạo được | **1** | **30 ngày** | **128 KB** | Có | Mili-giây, rẻ hơn Standard-IA khoảng 20%, mất AZ là mất dữ liệu |
| **Glacier Instant Retrieval** | Vài lần/năm, khi cần phải có ngay | ≥ 3 | **90 ngày** | **128 KB** | Có, cao hơn IA | **Mili-giây** |
| **Glacier Flexible Retrieval** | Lưu kho, chấp nhận chờ | ≥ 3 | **90 ngày** | Cộng thêm khoảng 40 KB metadata mỗi object | Có, **Bulk miễn phí** | Expedited 1 đến 5 phút, Standard 3 đến 5 giờ, Bulk 5 đến 12 giờ |
| **Glacier Deep Archive** | Lưu nhiều năm, gần như không đọc | ≥ 3 | **180 ngày** | Cộng thêm khoảng 40 KB metadata mỗi object | Có | Standard trong 12 giờ, Bulk trong 48 giờ, **rẻ nhất toàn AWS** |

Con số cần thuộc là **30, 90, 180 ngày** và **128 KB**. S3 Express One Zone là lớp hiệu năng cao (1 AZ, độ trễ mili-giây một chữ số), không phải lớp để tiết kiệm tiền. Cây quyết định khi đọc đề:

```text
Sống < 30 ngày rồi xóa => Standard | Pattern không đoán trước => Intelligent-Tiering (trừ object < 128 KB)
Biết rõ pattern => Lifecycle chuyển dần xuống:
  Ít truy cập, cần mili-giây => Standard-IA (dữ liệu quan trọng) hoặc One Zone-IA (tái tạo được)
  Lưu kho vài lần/năm, cần mili-giây => Glacier Instant Retrieval
  Lưu kho, chờ phút đến giờ => Glacier Flexible (gấp: Expedited, hàng loạt: Bulk)
  Lưu nhiều năm, rẻ nhất, chờ 12 đến 48 giờ => Glacier Deep Archive
```

> **Pattern đề thi:** *Dữ liệu ít truy cập, có thể tạo lại được, cần đọc trong mili-giây với chi phí thấp nhất* => **S3 One Zone-IA**.

## 3. S3 Lifecycle Policy

Lifecycle Policy là tập quy tắc gắn trên bucket, gồm **Transition** (chuyển sang lớp rẻ hơn khi object đủ tuổi) và **Expiration** (xóa vĩnh viễn object hoặc phiên bản cũ). Quy tắc có thể lọc theo **prefix** (ví dụ `logs/2026/`), theo **tag** (ví dụ `Environment=Test`) hoặc theo kích thước, nên một bucket chạy được nhiều logic vòng đời khác nhau. Khi bucket bật Versioning, bạn viết quy tắc riêng cho **Current Versions** và **Noncurrent Versions**.

Ràng buộc thời gian là bẫy nặng nhất. Từ Standard sang Standard-IA hoặc One Zone-IA, object phải nằm ở Standard **tối thiểu 30 ngày**, nên đề yêu cầu chuyển sang IA sau 15 ngày là không cấu hình được. Từ Standard sang bất kỳ lớp Glacier nào thì chuyển được **ngay ngày 0**. Từ Standard-IA sang Intelligent-Tiering không có giới hạn ngày. Lifecycle chỉ chuyển **xuống** theo mô hình thác nước, muốn đưa dữ liệu từ Glacier về Standard thì phải khôi phục rồi copy.

Kích thước object là bẫy thứ hai. Standard-IA, One Zone-IA và Glacier Instant Retrieval tính mỗi object tối thiểu 128 KB, nên chuyển hàng triệu file vài KB (log, dữ liệu IoT) sang IA không tiết kiệm được mà còn tốn phí chuyển tầng. Hiện nay Lifecycle mặc định không chuyển tầng object nhỏ hơn 128 KB. Cách đúng là **gộp file nhỏ thành file lớn** (ví dụ bằng AWS Glue) rồi mới chạy Lifecycle.

Với bucket bật Versioning, xóa file chỉ cắm một **Delete Marker**, còn các phiên bản thật vẫn tính tiền, nên cần quy tắc expire **Noncurrent Versions** kèm **Remove expired object delete markers**. Upload Multipart bị đứt giữa chừng để lại các phần ẩn vẫn tính tiền, nên luôn bật **`AbortIncompleteMultipartUpload`** sau N ngày, thường là 7 ngày. Bản thân Lifecycle cũng tốn tiền: phí chuyển tầng tính trên mỗi 1,000 object (ví dụ $0.01), nên chạy trên hàng trăm triệu file nhỏ có thể đắt hơn số tiền tiết kiệm. Phí xóa sớm (Early Deletion Fee) áp dụng khi object bị xóa trước hạn tối thiểu: chuyển sang Glacier Flexible rồi 10 ngày sau xóa thì vẫn trả thêm 80 ngày, vì vậy dữ liệu sống quá ngắn nên giữ ở Standard rồi xóa thẳng. Khi chưa có số liệu để viết quy tắc, **S3 Storage Class Analysis** quan sát bucket rồi gợi ý mốc ngày nên chuyển sang Standard-IA, nhưng nó không tự chuyển tầng.

> **Pattern đề thi:** *Bucket bật Versioning, đã xóa rất nhiều file nhưng dung lượng và hóa đơn vẫn tăng* => **Lifecycle expire Noncurrent Versions và bật Remove expired object delete markers**.

## 4. S3 Intelligent-Tiering

Intelligent-Tiering tự theo dõi từng object và hạ tầng khi object không được truy cập. Khi object ở tầng thấp được đọc lại, nó lập tức quay về tầng Frequent Access trong mili-giây và **không mất phí truy xuất**. Đổi lại, bạn trả **phí giám sát và tự động hóa** khoảng $0.0025 cho mỗi 1,000 object mỗi tháng. Lớp này không có thời gian lưu tối thiểu.

| Tầng | Kích hoạt | Object rơi xuống khi | Thời gian lấy | Mức giá tương đương |
|------|-----------|----------------------|---------------|---------------------|
| **Frequent Access** | Mặc định | Mới upload | Mili-giây | Giá Standard |
| **Infrequent Access** | Tự động | 30 ngày liên tục không truy cập | Mili-giây | Rẻ hơn khoảng 40% |
| **Archive Instant Access** | Tự động | 90 ngày liên tục không truy cập | Mili-giây | Rẻ hơn khoảng 68%, ngang Glacier Instant |
| **Archive Access** | **Phải bật thủ công** | Từ 90 ngày trở lên (cấu hình được) | 3 đến 5 giờ | Ngang Glacier Flexible |
| **Deep Archive Access** | **Phải bật thủ công** | Từ 180 ngày trở lên (cấu hình được) | Tối đa 12 giờ | Ngang Glacier Deep Archive |

Ngữ cảnh ra đề điển hình là data lake không ai biết file nào sẽ bị query, và nội dung người dùng tạo ra như ảnh hoặc video cũ bất ngờ viral trở lại. Intelligent-Tiering **không giúp tiết kiệm** khi object nhỏ hơn 128 KB (không được giám sát, luôn nằm ở Frequent), khi có hàng tỷ object nhỏ (phí giám sát theo object nuốt hết phần tiết kiệm), hoặc khi pattern đã biết rõ (Lifecycle rẻ hơn vì không có phí giám sát).

> **Pattern đề thi:** *Đang dùng Standard-IA nhưng phí truy xuất tăng vọt vì dữ liệu cũ thỉnh thoảng lại được đọc nhiều, không rõ chu kỳ* => **S3 Intelligent-Tiering**.

## 5. Họ S3 Glacier và các tính năng S3 liên quan

Glacier cắt 80 đến 90% chi phí lưu trữ so với Standard cho dữ liệu lưu kho, đổi lại có phí truy xuất, thời gian lưu tối thiểu dài và thường phải chờ khôi phục. **Glacier Instant Retrieval** là tầng lai lấy dữ liệu trong mili-giây, tối thiểu 90 ngày. **Glacier Flexible Retrieval** (trước đây là Glacier) có ba tùy chọn khôi phục: Expedited 1 đến 5 phút và đắt nhất, Standard 3 đến 5 giờ là mặc định, Bulk 5 đến 12 giờ và miễn phí truy xuất, tối thiểu 90 ngày. Muốn **bảo đảm** yêu cầu Expedited luôn được phục vụ thì mua **Provisioned Capacity**. **Glacier Deep Archive** rẻ nhất toàn AWS, khôi phục Standard trong 12 giờ hoặc Bulk trong 48 giờ, tối thiểu 180 ngày.

Ngữ cảnh ra đề gồm lưu hồ sơ tuân thủ pháp lý 7 đến 10 năm, thay thế băng từ on-premises, và làm trạm cuối của Lifecycle (ví dụ log ở Standard 30 ngày, sang Standard-IA 60 ngày, rồi sang Deep Archive). Trước đây Glacier là dịch vụ riêng dùng **Vault** và **Archive** với API riêng, với hai tính năng gắn theo Vault là **Vault Lock** (khóa chính sách WORM, đã khóa thì không đổi được) và **Data Retrieval Policies** (giới hạn lượng truy xuất để tránh hóa đơn đột biến). Hiện nay Glacier là các lớp lưu trữ ngay trong S3, quản lý như object thường. Một số tính năng S3 khác cũng ảnh hưởng tiền. **Versioning** giữ mọi phiên bản (có thể bật MFA Delete) và phiên bản nào cũng tính tiền. **S3 Object Lock** là WORM ở cấp object: chế độ **Governance** cho người có quyền `s3:BypassGovernanceRetention` gỡ khóa, chế độ **Compliance** thì không ai xóa hay sửa được, kể cả Root, và hay đi cùng Glacier cho lưu trữ pháp lý giá rẻ. **Replication** bắt buộc bật Versioning ở cả hai bucket: **CRR** (khác Region) phục vụ DR, chạy bất đồng bộ nên RPO là vài phút chứ không phải 0, tốn phí truyền giữa Region cộng tiền bản sao, và có thể chọn lớp rẻ hơn cho bucket đích; **SRR** (cùng Region) dùng để gộp log hoặc chia sẻ dữ liệu giữa môi trường. **Requester Pays** chuyển phí tải xuống sang người tải, chi tiết ở tag Network-Costs.

> **Pattern đề thi:** *Cần khôi phục khẩn cấp một file backup từ Glacier Flexible Retrieval trong vòng dưới 5 phút* => **Expedited Retrieval**.

## 6. So sánh và chọn trong nhóm

| Tiêu chí | Lifecycle Policy | Intelligent-Tiering | Ghi thẳng vào Glacier |
|----------|------------------|---------------------|-----------------------|
| Cơ chế | Quy tắc tĩnh theo tuổi object | Tự động theo hành vi truy cập | Chọn lớp lưu kho ngay khi ghi |
| Pattern phù hợp | Biết trước | Không đoán trước | Chắc chắn là lưu kho |
| Đọc lại dữ liệu cũ | Tính phí truy xuất | Không phí, tự về Frequent | Tính phí, phải chờ (trừ Instant) |
| Phí đặc thù | Phí chuyển tầng mỗi 1,000 object | Phí giám sát mỗi 1,000 object mỗi tháng | Lưu tối thiểu 90 hoặc 180 ngày |
| Object < 128 KB | Không nên chuyển tầng | Không được chuyển tầng | Chịu thêm khoảng 40 KB mỗi object |

Standard-IA và One Zone-IA giống nhau ở 30 ngày, 128 KB và mili-giây, khác nhau ở số AZ, nên dữ liệu tái tạo được thì chọn One Zone-IA còn dữ liệu duy nhất thì chọn Standard-IA. Standard-IA hợp với truy cập khoảng một lần mỗi tháng, còn Glacier Instant hợp với vài lần mỗi năm vì lưu rẻ hơn nhưng truy xuất đắt hơn và tối thiểu 90 ngày. Đề ghi rẻ nhất tuyệt đối, lưu trên 180 ngày, chờ 12 giờ thì chọn Deep Archive chứ không chọn Intelligent-Tiering, trừ khi đề nhấn mạnh truy cập không đoán trước.

> **Pattern đề thi:** *Dữ liệu nóng 30 ngày đầu, sau đó hiếm khi đọc, sau 90 ngày chỉ cần lưu kho* => **Lifecycle Policy: Standard => Standard-IA sau 30 ngày => Glacier sau 90 ngày**.

## 7. Kịch bản thi

1. Tối ưu chi phí S3 cho dữ liệu có pattern truy cập không đoán trước. => S3 Intelligent-Tiering.
2. Hồ sơ phải lưu 7 năm, rẻ nhất, chấp nhận chờ 12 giờ khi cần đọc. => S3 Glacier Deep Archive.
3. Ảnh cũ hiếm khi xem nhưng khi xem phải hiện ngay. => S3 Glacier Instant Retrieval.
4. File chỉ cần giữ 15 đến 20 ngày rồi xóa. => S3 Standard kèm Lifecycle Expiration.
5. Hàng triệu file log vài chục KB, cần giảm chi phí. => Gộp file trước rồi mới chạy Lifecycle, không chuyển thẳng sang Standard-IA.
6. File upload dở dang vì rớt mạng vẫn bị tính tiền. => Lifecycle AbortIncompleteMultipartUpload.
7. Khôi phục nhiều TB từ Glacier Flexible, không gấp, rẻ nhất. => Bulk Retrieval.
8. Log pháp lý không ai được xóa, kể cả Root, lưu rẻ nhiều năm. => S3 Object Lock chế độ Compliance kết hợp Glacier Deep Archive.

## 8. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Chuyển Standard sang Standard-IA sau 15 ngày | Không cấu hình được, tối thiểu 30 ngày (sang họ Glacier thì được ngay ngày 0) | Chấp nhận phương án 15 ngày |
| Dữ liệu 10 ngày rồi xóa | S3 Standard | Standard-IA hoặc Glacier (bị tính đủ 30 hoặc 90 ngày) |
| Rất nhiều object nhỏ hơn 128 KB, hoặc hàng tỷ object nhỏ | Gộp file trước | Intelligent-Tiering hoặc Standard-IA (mức tính 128 KB và phí giám sát nuốt hết tiền tiết kiệm) |
| Intelligent-Tiering không tự xuống mức giá Glacier | Bật thủ công tầng Archive Access và Deep Archive Access | Nghĩ tầng archive tự bật |
| Dữ liệu lúc đọc nhiều lúc đọc ít, không rõ chu kỳ | Intelligent-Tiering | Glacier (phí truy xuất, phải chờ) |
| Dữ liệu duy nhất, quan trọng, ít truy cập | Standard-IA | One Zone-IA (mất AZ là mất dữ liệu) |
| Chuyển tầng hàng trăm triệu file nhỏ | Phí chuyển tầng có thể vượt tiền tiết kiệm | Nghĩ Lifecycle miễn phí |
| Lo nhân viên truy xuất quá nhiều từ Glacier Vault | Data Retrieval Policies | Vault Lock (là WORM) |
| Cần RPO bằng 0 cho S3 | Kiến trúc active-active hoặc đồng bộ ở tầng ứng dụng | CRR thuần (bất đồng bộ) |

## 9. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Lifecycle Policy vs Intelligent-Tiering:** Lifecycle chạy theo quy tắc tĩnh dựa trên tuổi object nên hợp với pattern biết trước. Intelligent-Tiering tự hành động theo hành vi thực tế, không phí truy xuất nhưng có phí giám sát, nên hợp với pattern không đoán trước.
- **Intelligent-Tiering vs Storage Class Analysis:** Storage Class Analysis chỉ phân tích và gợi ý mốc ngày, không tự chuyển tầng. Intelligent-Tiering là một lớp lưu trữ thật và tự chuyển tầng.
- **Expedited vs Standard vs Bulk:** Đây là ba tốc độ khôi phục của Glacier Flexible. Expedited mất 1 đến 5 phút và đắt nhất, Standard mất 3 đến 5 giờ, Bulk mất 5 đến 12 giờ và miễn phí truy xuất.
- **S3 Object Lock vs Glacier Vault Lock:** Object Lock áp dụng cho từng object, chế độ Governance còn gỡ được bằng quyền đặc biệt. Vault Lock áp dụng cho cả Vault và đã khóa thì không đảo ngược.

## 10. Câu nhớ nhanh trước khi thi

> **Không rõ pattern truy cập => Intelligent-Tiering, không phí truy xuất, đọc lại là về Frequent trong mili-giây.**
>
> **Biết rõ lúc dữ liệu nguội => Lifecycle Policy gồm Transition để đổi tầng và Expiration để xóa.**
>
> **Con số vàng: IA 30 ngày, Glacier Instant và Flexible 90 ngày, Deep Archive 180 ngày, object nhỏ 128 KB. Standard sang IA phải đợi 30 ngày, sang họ Glacier thì được ngay.**
>
> **Lưu kho cần mili-giây => Glacier Instant. Chờ phút hoặc giờ => Glacier Flexible. Rẻ nhất, chờ 12 đến 48 giờ => Deep Archive.**
>
> **Dữ liệu sống dưới 30 ngày => để Standard. File siêu nhỏ => gộp trước. Intelligent-Tiering muốn xuống mức giá Glacier => bật thủ công hai tầng Archive. Versioning phình tiền => expire Noncurrent Versions và dọn Delete Markers. Upload dở dang => AbortIncompleteMultipartUpload.**

# Chi phí mạng: Data Transfer và VPC Endpoint

> **Domain:** Cost-Optimized Architectures (exam Domain 4). Tag: Network-Costs (Data Transfer / VPC Endpoint). Hiểu dữ liệu di chuyển theo hướng nào thì bị tính phí, và thiết kế đường đi để không trả tiền oan cho NAT Gateway, cho traffic khác AZ, khác Region hay ra Internet.
> **Mức độ ra đề:** Cao. Chi phí mạng là bẫy ẩn trong hóa đơn, hay đi cặp với câu hỏi private subnet gọi S3 qua NAT Gateway, Gateway Endpoint so với Interface Endpoint, và CloudFront so với S3 Transfer Acceleration.
> **Cross-reference:** VPC-Endpoint, Amazon-CloudFront, AWS-Direct-Connect-Transit-Gateway, S3-Storage-Classes-and-Lifecycle, Amazon S3, Cost-Visibility-and-Governance, AWS-Global-Accelerator.

## 1. Tổng quan: tối ưu chi phí mạng giải quyết vấn đề gì

Nhiều team tối ưu instance type và storage class rất kỹ nhưng quên rằng **truyền dữ liệu có thể chiếm 30 đến 50% hóa đơn**. Một NAT Gateway gánh toàn bộ traffic tới S3, một bucket bị bot tải dữ liệu ra Internet, hay một job replicate sang Region khác đều có thể tạo hóa đơn data transfer khổng lồ mà không ai lường trước. Phí truyền dữ liệu tách biệt hoàn toàn với phí compute và phí lưu trữ, và phụ thuộc vào **hướng đi** của dữ liệu: vào hay ra AWS, cùng hay khác AZ, cùng hay khác Region, đi qua NAT hay qua đường riêng.

Năm khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Quy tắc tính phí data transfer** | Vào miễn phí, ra Internet tính phí, khác AZ tính phí, khác Region đắt hơn | Nền tảng để đọc mọi câu hỏi chi phí mạng |
| **NAT Gateway** | Cho private subnet ra Internet, tính phí theo giờ **và** theo GB xử lý | Chi phí ẩn lớn nhất khi traffic tới dịch vụ AWS đi qua nó |
| **VPC Gateway Endpoint** | Một **route** trong route table tới S3 hoặc DynamoDB | Đường riêng **miễn phí**, thay NAT cho S3 và DynamoDB |
| **VPC Interface Endpoint (PrivateLink)** | Một **ENI có private IP** trong subnet, có Security Group | Đường riêng tới hầu hết dịch vụ khác, tính phí theo giờ và theo GB |
| **CloudFront và Direct Connect** | CDN cache tại edge, và đường truyền riêng từ on-premises | Giảm phí ra Internet cho nội dung và cho khối lượng lớn từ on-premises |

> **Một câu định vị:** private subnet gọi S3 hoặc DynamoDB rẻ nhất => **Gateway Endpoint**. Gọi KMS, Secrets Manager, SQS, SSM riêng tư hoặc gọi từ on-premises => **Interface Endpoint**. Ra Internet thật sự như tải bản vá hay gọi API bên ngoài => **NAT Gateway**. Người dùng toàn cầu tải nội dung từ S3 => **CloudFront**. Tăng tốc **upload** từ xa => **S3 Transfer Acceleration** (nhanh hơn, không rẻ hơn). Muốn người tải trả phí => **Requester Pays**. Khối lượng lớn ổn định từ on-premises => **Direct Connect**.

## 2. Quy tắc tính phí data transfer

| Luồng dữ liệu | Phí | Ghi chú thi |
|---------------|-----|-------------|
| Internet vào AWS | **Miễn phí** | Inbound luôn free |
| AWS ra Internet | **Tính phí**, giảm dần theo bậc dung lượng | Nguồn chi phí phổ biến nhất: S3 download, EC2 phục vụ web, API response |
| Cùng AZ, dùng private IP | **Miễn phí** | EC2 nói chuyện với RDS trong cùng AZ |
| Khác AZ, cùng Region | **Tính phí**, khoảng $0.01/GB mỗi chiều | Hay bị quên khi thiết kế Multi-AZ |
| Khác Region | **Tính phí cao hơn**, tính ở Region gửi dữ liệu đi | CRR, cross-Region Read Replica, backup sang Region DR |
| S3 sang CloudFront | **Miễn phí** | CloudFront lấy dữ liệu từ origin S3 không tính phí transfer |
| S3 sang EC2 cùng Region | **Miễn phí** | Không đi qua Internet |
| CloudFront tới người dùng | Tính phí, thường **rẻ hơn** S3 hoặc EC2 ra Internet trực tiếp | Cache tại edge còn giảm tải cho origin |
| S3 Transfer Acceleration | **Phí cộng thêm** | Nhanh hơn khi upload, không bao giờ rẻ hơn |
| Direct Connect ra on-premises | Tính phí, **rẻ hơn** ra Internet | Ổn định hơn VPN qua Internet |

> **Pattern đề thi:** *Chi phí S3 outbound tăng cao do người dùng toàn cầu tải file lớn* => **Đặt CloudFront trước S3** (S3 sang CloudFront miễn phí, CloudFront cache tại edge).

## 3. Traffic khác AZ và khác Region

Traffic giữa EC2 ở `us-east-1a` và cơ sở dữ liệu ở `us-east-1b` bị tính phí inter-AZ mỗi chiều. Riêng phần replication đồng bộ giữa primary và standby của RDS Multi-AZ thì AWS không tính phí truyền dữ liệu, nhưng traffic từ ứng dụng tới primary nằm khác AZ vẫn bị tính. Với NLB bật cross-zone load balancing cũng phát sinh phí inter-AZ. Cách giảm là đặt tầng ứng dụng và tầng dữ liệu **cùng AZ** khi độ trễ và yêu cầu sẵn sàng cho phép, hoặc chấp nhận phí này như cái giá của Multi-AZ. Dùng một NAT Gateway cho mỗi AZ cũng tránh được traffic NAT đi vòng sang AZ khác.

Traffic khác Region như S3 Cross-Region Replication, RDS cross-Region Read Replica hay backup sang Region DR đắt hơn inter-AZ đáng kể, và CRR còn cộng tiền lưu bản sao ở Region đích. Chỉ replicate dữ liệu thực sự cần cho mục tiêu RPO, dùng Same-Region Replication nếu chỉ cần bản sao cùng Region, và đưa phí truyền dữ liệu vào tổng chi phí khi chọn chiến lược DR.

> **Pattern đề thi:** *Backup S3 sang Region khác để DR nhưng lo chi phí truyền dữ liệu* => **CRR chỉ cho dữ liệu quan trọng theo RPO, hoặc SRR nếu không cần khác Region**.

## 4. NAT Gateway và VPC Endpoint

NAT Gateway tính phí **theo giờ** và **theo GB dữ liệu xử lý**, khoảng $0.045 mỗi giờ cộng $0.045 mỗi GB. Mọi traffic từ private subnet đi qua nó đều chịu phí xử lý, kể cả traffic tới S3 và DynamoDB vốn có thể đi đường riêng miễn phí. Đây là lý do NAT Gateway là một trong những chi phí ẩn lớn nhất, và thiết kế đúng có thể cắt 60 đến 80% chi phí NAT.

**Gateway Endpoint** chỉ hỗ trợ **S3 và DynamoDB**, hoàn toàn **miễn phí**, hoạt động bằng cách thêm route có đích là prefix list của dịch vụ (ví dụ `pl-xxxx`) vào route table của subnet. Nó chỉ dùng được bên trong VPC đó, không dùng được từ on-premises hay VPC khác. **Interface Endpoint** đặt một ENI có private IP vào subnet, hỗ trợ hầu hết dịch vụ còn lại như KMS, SQS, SNS, Secrets Manager, CloudWatch, SSM, và tính phí theo giờ cho mỗi AZ (khoảng $7 mỗi tháng mỗi AZ) cộng phí mỗi GB thấp hơn NAT, nên rẻ hơn NAT khi traffic tới dịch vụ đó đủ lớn. Vì là private IP, Interface Endpoint dùng được từ on-premises qua Direct Connect hoặc VPN. S3 cũng có Interface Endpoint cho trường hợp on-premises, nhưng trong VPC mà đề nhấn mạnh rẻ nhất thì Gateway vẫn là đáp án.

| Traffic đích | Giải pháp rẻ nhất | Ghi chú |
|--------------|-------------------|---------|
| S3 cùng Region | S3 Gateway Endpoint | Bỏ toàn bộ phí NAT cho S3 |
| DynamoDB cùng Region | DynamoDB Gateway Endpoint | Bỏ toàn bộ phí NAT cho DynamoDB |
| Secrets Manager, SSM, KMS | Interface Endpoint | Rẻ hơn NAT khi traffic đủ lớn, còn riêng tư hơn |
| Internet (bản vá, API bên ngoài) | NAT Gateway | Bắt buộc, mỗi AZ một NAT để tránh traffic khác AZ |

> **Pattern đề thi:** *EC2 trong private subnet đọc ghi S3 rất nhiều, hóa đơn NAT Gateway tăng vọt* => **Tạo S3 Gateway Endpoint và gắn vào route table của private subnet**.

## 5. Lambda trong VPC và góc bảo mật của endpoint

Lambda gắn vào VPC dùng ENI trong subnet, nên các lời gọi tới S3, DynamoDB hay Secrets Manager sẽ đi qua NAT và tốn tiền nếu không có endpoint. Kiến trúc tối ưu là Gateway Endpoint cho S3 và DynamoDB, Interface Endpoint cho Secrets Manager và SSM khi traffic đủ lớn, và chỉ dùng NAT cho traffic thực sự ra Internet. Khi Lambda cần tới RDS private thì đặt Lambda **trong VPC** kèm **RDS Proxy** để gom kết nối, vì Lambda ngoài VPC không kết nối được RDS private qua RDS Proxy.

Về bảo mật, tóm tắt ngắn: **Endpoint Policy** gắn trên endpoint giới hạn endpoint đó được gọi tới tài nguyên nào, ví dụ chỉ một bucket. Chiều ngược lại, Bucket Policy với điều kiện **`aws:SourceVpce`** (hoặc `aws:SourceVpc` cho cả VPC) buộc bucket chỉ nhận request đi qua endpoint đó. Ba lỗi cấu hình hay gặp là quên thêm route của Gateway Endpoint vào đúng route table, quên bật **Private DNS** khiến tên dịch vụ vẫn phân giải ra public IP và traffic vẫn ra Internet, và Security Group của ENI endpoint chưa mở HTTPS 443 từ subnet ứng dụng. Chi tiết bảo mật nằm ở tag VPC-Endpoint.

> **Pattern đề thi:** *Đã tạo Interface Endpoint nhưng traffic tới dịch vụ vẫn đi ra Internet* => **Bật Private DNS cho endpoint**.

## 6. CloudFront, Transfer Acceleration, Requester Pays và Direct Connect

**CloudFront** là CDN cache nội dung gần người dùng, vừa giảm tải origin vừa giảm phí ra Internet, và là đáp án cho bài toán **tải xuống** hoặc phân phối nội dung toàn cầu. Bucket bị tải nhiều thì đặt CloudFront với OAC hoặc OAI phía trước. **S3 Transfer Acceleration** đưa **upload** qua edge location vào backbone AWS, có phí riêng và thường đắt hơn, chỉ dùng khi cần tốc độ upload từ xa. **Requester Pays** chuyển phí tải dữ liệu từ chủ bucket sang người tải, hợp khi chia sẻ dataset lớn cho đối tác. **Direct Connect** là kết nối riêng từ on-premises với phí truyền ra thấp hơn Internet cho khối lượng lớn và ổn định, trong khi VPN qua Internet rẻ khi thiết lập nhưng vẫn chịu phí Internet và kém ổn định hơn.

> **Pattern đề thi:** *Chia sẻ bộ dữ liệu vài trăm TB trên S3 cho nhiều đối tác, muốn bên tải chịu phí truyền dữ liệu* => **S3 Requester Pays**.

## 7. So sánh và chọn trong nhóm

| Tiêu chí | NAT Gateway | Gateway Endpoint | Interface Endpoint |
|----------|-------------|------------------|--------------------|
| Đích | Internet (và dịch vụ AWS qua đường public) | Chỉ S3 và DynamoDB | Hầu hết dịch vụ AWS, dịch vụ PrivateLink |
| Cơ chế | Thiết bị NAT managed trong public subnet | Route trong route table | ENI có private IP, có Security Group |
| Phí | Theo giờ và theo GB xử lý | **Miễn phí** | Theo giờ mỗi AZ và theo GB |
| Dùng từ on-premises hoặc VPC khác | Không | Không | **Có** |

> **Pattern đề thi:** *Chỉ cần gọi S3 và DynamoDB từ private subnet, muốn bỏ NAT Gateway cho rẻ* => **Gateway Endpoint thay cho NAT Gateway**.

## 8. Kịch bản thi

1. EC2 private subnet gọi S3 tốn phí NAT. => S3 Gateway Endpoint.
2. Người dùng toàn cầu tải nội dung tĩnh từ S3, cần giảm độ trễ và chi phí. => CloudFront với origin S3.
3. Upload file lớn từ xa lên bucket ở Mỹ bị chậm. => S3 Transfer Acceleration, chấp nhận đắt hơn.
4. Truyền dữ liệu lớn và ổn định giữa on-premises và AWS. => Direct Connect thay VPN qua Internet.
5. Tầng ứng dụng và cơ sở dữ liệu khác AZ, phí inter-AZ tăng. => Cân nhắc đặt cùng AZ, đánh đổi với tính sẵn sàng.
6. Gọi Secrets Manager từ on-premises qua Direct Connect một cách riêng tư. => Interface Endpoint.
7. Bucket S3 chỉ được truy cập từ trong VPC. => Bucket Policy với điều kiện aws:SourceVpce.
8. Dữ liệu từ Internet vào AWS có tốn phí không. => Không, inbound luôn miễn phí.

## 9. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Private subnet truy cập S3, rẻ nhất | Gateway Endpoint | Interface Endpoint cho S3 hoặc NAT Gateway |
| Truy cập KMS, SQS, SSM riêng tư | Interface Endpoint | Gateway Endpoint (chỉ S3 và DynamoDB) |
| Giảm chi phí tải xuống toàn cầu | CloudFront | S3 Transfer Acceleration (tăng tốc upload, không giảm chi phí) |
| Đã tạo Gateway Endpoint nhưng traffic vẫn đi qua NAT | Thêm route tới endpoint vào route table của subnet | Tạo thêm endpoint |
| Interface Endpoint không kết nối được | Security Group của ENI mở 443 từ subnet ứng dụng | Sửa route table |
| Chi phí traffic khác AZ | Tính phí mỗi chiều | Nghĩ cùng Region là miễn phí |
| Mỗi AZ dùng chung một NAT ở AZ khác | Mỗi AZ một NAT Gateway | Một NAT cho cả VPC |
| Lambda trong VPC gọi DynamoDB tốn phí NAT | DynamoDB Gateway Endpoint | Đưa Lambda ra ngoài VPC khi vẫn cần RDS private |

## 10. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **NAT Gateway vs Gateway Endpoint:** NAT Gateway cho private subnet ra Internet và tính phí theo giờ cộng theo GB. Gateway Endpoint là đường riêng miễn phí tới S3 và DynamoDB, không qua Internet và không qua NAT.
- **Gateway Endpoint vs Interface Endpoint:** Gateway chỉ cho S3 và DynamoDB, là một route, miễn phí, không có Security Group và không dùng được ngoài VPC. Interface cho mọi dịch vụ khác, là ENI có private IP, có phí, có Security Group và dùng được từ on-premises.
- **CloudFront vs S3 Transfer Acceleration:** CloudFront cache nội dung để tải xuống rẻ và nhanh hơn. Transfer Acceleration tăng tốc upload qua edge location và luôn tốn thêm tiền.
- **CloudFront vs Global Accelerator:** CloudFront cache nội dung HTTP và giảm phí truyền từ origin. Global Accelerator tối ưu định tuyến TCP và UDP qua backbone AWS, không cache, hợp với game, IoT và traffic không phải HTTP.
- **Inter-AZ vs Cross-Region:** Inter-AZ rẻ hơn nhiều, khoảng $0.01/GB mỗi chiều, nhưng vẫn tính phí. Cross-Region đắt hơn đáng kể.
- **Endpoint Policy vs aws:SourceVpce:** Endpoint Policy nằm trên endpoint và quyết định endpoint được gọi tới đâu. `aws:SourceVpce` nằm trong policy của tài nguyên và quyết định tài nguyên chỉ nhận traffic từ endpoint nào.

## 11. Câu nhớ nhanh trước khi thi

> **Vào AWS miễn phí. Ra Internet tính phí. Cùng AZ miễn phí. Khác AZ tính phí mỗi chiều. Khác Region đắt hơn.**
>
> **NAT Gateway tính theo giờ và theo GB. Đừng cho traffic S3 và DynamoDB đi qua NAT.**
>
> **Gateway Endpoint là route, chỉ S3 và DynamoDB, miễn phí. Interface Endpoint là ENI, mọi dịch vụ khác, có phí, dùng được từ on-premises.**
>
> **Tải xuống toàn cầu => CloudFront, vì S3 sang CloudFront miễn phí. Upload nhanh => Transfer Acceleration, không rẻ hơn.**
>
> **Người tải trả tiền => Requester Pays. Khối lượng lớn từ on-premises => Direct Connect.**
>
> **Interface Endpoint vẫn ra Internet => bật Private DNS. Gateway Endpoint không có tác dụng => kiểm tra route table.**

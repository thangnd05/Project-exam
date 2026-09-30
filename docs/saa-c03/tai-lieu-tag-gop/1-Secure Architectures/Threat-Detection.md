# Amazon GuardDuty, Amazon Inspector, Amazon Macie và AWS Security Hub

> **Domain:** Secure Architectures (exam Domain 1). Tag: Threat-Detection (GuardDuty / Inspector / Macie / Security Hub). Ba dịch vụ phát hiện chuyên biệt (hành vi tấn công, lỗ hổng phần mềm, dữ liệu nhạy cảm trong S3) và một dịch vụ gom mọi finding về một dashboard có chấm điểm tuân thủ.
> **Mức độ ra đề:** Trung bình đến cao. GuardDuty, Inspector và Macie gần như luôn xuất hiện chung một câu để làm đáp án gây nhiễu cho nhau; Security Hub đi với keyword *centralized security findings, compliance score, CIS/PCI*. Nắm chắc dịch vụ nào soi cái gì là đủ ăn điểm.
> **Cross-reference:** IAM-STS, AWS-Audit-Logging, Amazon-EventBridge, AWS-Systems-Manager, AWS-Network-Protection, S3-Encryption-Policies.

## 1. Tổng quan: bộ phát hiện mối đe dọa giải quyết vấn đề gì

Bốn sự việc khác nhau hay bị gom vào cùng một đề: một EC2 đang đào tiền mã hóa, một access key bị lộ đang được dùng từ quốc gia lạ, một container image trên ECR chứa thư viện có CVE nghiêm trọng, và một bucket public đang chứa số thẻ tín dụng. Cuối cùng ban lãnh đạo lại muốn **một dashboard duy nhất** với điểm tuân thủ CIS hoặc PCI. CloudTrail chỉ **ghi lại** API call, còn AWS Config chỉ biết **cấu hình** tài nguyên, nên cả hai không tự trả lời được những câu này.

Cả bốn dịch vụ trong nhóm đều là **detective** (phát hiện), **không phải preventive** (phòng ngừa): chúng tạo **finding** chứ không tự chặn. Muốn phản ứng tự động, đưa finding qua **EventBridge** tới Lambda hoặc SNS. Cả bốn đều quản lý tập trung cho toàn tổ chức qua **delegated administrator** trong AWS Organizations.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **GuardDuty** | Phân tích log liên tục (VPC Flow Logs, DNS, CloudTrail) bằng ML và threat intelligence | Phát hiện **hành vi** tấn công đang diễn ra |
| **Inspector** | Quét tự động, liên tục EC2, image trên ECR và Lambda | Phát hiện **lỗ hổng/CVE** và cổng mở ngoài ý muốn |
| **Macie** | Machine learning quét object trong S3 | Phát hiện **dữ liệu nhạy cảm** (PII, PHI, tài chính) và bucket rủi ro |
| **Security Hub** | Dashboard trung tâm gom finding và chấm điểm theo chuẩn | **Tổng hợp** và đo mức tuân thủ, không tự phát hiện |

> **Một câu định vị:** **GuardDuty = hành vi (ai đang tấn công). Inspector = lỗ hổng (chỗ nào yếu). Macie = dữ liệu (trong S3 có gì nhạy cảm). Security Hub = gom lại và chấm điểm.** Tài nguyên bị share ra ngoài => IAM Access Analyzer. Cấu hình có tuân thủ rule không => AWS Config. Ai đã làm gì => CloudTrail. Điều tra nguyên nhân gốc của finding => Amazon Detective.

## 2. Amazon GuardDuty: phát hiện hành vi

GuardDuty là dịch vụ threat detection **managed hoàn toàn, không cần agent**, bật một click là chạy. Ba nguồn lõi được phân tích mặc định mà bạn không phải tự bật: **VPC Flow Logs** (kết nối tới IP lạ, cổng bất thường), **DNS logs** (truy vấn domain độc hại, dấu hiệu máy chủ điều khiển của malware) và **CloudTrail management events** (tắt CloudTrail, tạo user lạ, gọi API từ vị trí bất thường). Các protection plan bật thêm gồm **S3 Protection** (CloudTrail S3 data events), **EKS Protection** (audit log của Kubernetes), **RDS Protection** (hoạt động đăng nhập), **Lambda Protection** (hoạt động mạng) và **Malware Protection**.

Finding điển hình gồm EC2 bị xâm nhập (liên lạc IP hoặc domain độc hại, đào coin, tham gia botnet), credential bị lạm dụng (dùng từ vị trí địa lý bất thường, gọi API kiểu trinh sát), tấn công vào account (vô hiệu hóa CloudTrail, đổi password policy), S3 bị truy cập bất thường, và quét cổng từ bên ngoài. Mỗi finding có mức **Low, Medium hoặc High**.

### 2.1. Malware Protection và tự động phản ứng

Phần lớn GuardDuty chỉ đọc log để suy ra hành vi. **Malware Protection** là ngoại lệ: nó **thực sự quét file** trên **EBS volume** qua snapshot, **agentless**, thường được kích hoạt khi một finding nghi EC2 bị xâm nhập. Nó tìm **malware đã có mặt**, khác Inspector tìm **lỗ hổng có thể bị khai thác**.

Vì GuardDuty **không tự chặn**, kiến trúc chuẩn là **GuardDuty => EventBridge => Lambda hoặc SNS**: rule EventBridge lọc finding (ví dụ mức High), Lambda cô lập EC2 bằng cách đổi security group, thu hồi credential, hoặc chặn IP qua NACL hay WAF, còn SNS báo cho đội bảo mật. Với nhiều account, chỉ định một **delegated administrator** trong Organizations để bật và xem finding của mọi account ở một nơi.

> **Pattern đề thi:** *Tự động cô lập EC2 khi GuardDuty phát hiện mối đe dọa mức cao* => **EventBridge bắt finding rồi gọi Lambda**, vì GuardDuty tự nó không khắc phục.

## 3. Amazon Inspector: quét lỗ hổng

Inspector (phiên bản v2 hiện hành) quét **tự động và liên tục**: tự quét tài nguyên mới, tự đánh giá lại khi có CVE mới công bố, không cần lên lịch. Nó quét **EC2** tìm CVE của hệ điều hành và phần mềm cùng lỗi **network reachability** (cổng mở ra Internet ngoài ý muốn, ví dụ cổng 22 mở ra 0.0.0.0/0), quét **container image trên ECR** khi push, và quét **Lambda** tìm CVE trong dependency và package (không phải quét toàn bộ mã nghiệp vụ kiểu SAST). Với EC2, Inspector dùng **SSM Agent** thường có sẵn trên AMI hiện đại.

Mỗi finding có **risk score** (Critical, High, Medium, Low) để ưu tiên. Luồng xử lý chuẩn: finding gom về **Security Hub**, lọc rủi ro đã chấp nhận hoặc false positive bằng **suppression rules** (theo CVE, account, tag), tạo ticket hoặc cảnh báo qua **EventBridge**, rồi vá bằng **Systems Manager Patch Manager** hoặc build lại AMI. Inspector **chỉ phát hiện**, Patch Manager mới **thực thi việc vá**.

> **Pattern đề thi:** *Pipeline CI/CD đẩy image lên ECR và phải chặn image có CVE Critical, hoặc Lambda dùng thư viện dính lỗ hổng log4j* => **Amazon Inspector**.

## 4. Amazon Macie: dữ liệu nhạy cảm trong S3

Macie dùng **machine learning** và mẫu dựng sẵn để **phát hiện và phân loại dữ liệu nhạy cảm chỉ trong Amazon S3**: PII, PHI (hồ sơ sức khỏe), dữ liệu tài chính như số thẻ tín dụng, credential và key. Tổ chức có dữ liệu đặc thù thì định nghĩa **custom data identifier** bằng regex, ví dụ mã nhân viên nội bộ. Macie còn đánh giá **tư thế bảo mật của bucket** (public, chưa mã hóa, chia sẻ ra ngoài) và kết hợp với việc bucket có chứa dữ liệu nhạy cảm hay không để chấm rủi ro. Macie **không** quét database hay EBS.

**Automated sensitive data discovery** là chế độ managed, bật mặc định cho account hoặc tổ chức và tự đánh giá cả bucket mới. **Sensitive data discovery job** chạy một lần hoặc theo lịch (cron) trên bucket cụ thể, hợp với audit định kỳ; classification job là tên cũ, ít gặp. Luồng xử lý chuẩn: **Macie finding => EventBridge => Lambda** (bật block public access, gắn tag object) và **SNS** (báo đội compliance), đồng thời đẩy về **Security Hub**.

> **Pattern đề thi:** *Quét định kỳ mọi bucket để tìm số thẻ tín dụng và cả mã nhân viên nội bộ theo mẫu riêng* => **Macie sensitive data discovery job kèm custom data identifier**.

## 5. AWS Security Hub: gom finding và chấm điểm tuân thủ

Security Hub **không tự phát hiện** mà **tổng hợp** finding từ GuardDuty (hành vi), Inspector (CVE), Macie (PII), IAM Access Analyzer (tài nguyên bị share), AWS Config (cấu hình sai), Firewall Manager và các partner vào một dashboard. Nó chấm điểm theo các chuẩn **CIS AWS Foundations Benchmark**, **PCI-DSS** và **AWS Foundational Security Best Practices**; **security score** là phần trăm control đạt, giúp theo dõi cải thiện. Các control kiểm tra cấu hình (mã hóa đã bật chưa, public access, MFA cho root) chạy bằng Config rules, nên Config là **engine kiểm tra**, còn Security Hub là **lớp gom và chấm điểm**.

Ở quy mô tổ chức, bật Security Hub tại management account hoặc **delegated administrator** để finding của mọi member account đổ về một chỗ; mô hình landing zone thường có một account **Security Tooling** chạy GuardDuty, Security Hub và Inspector. Finding Critical có thể đi tiếp qua **EventBridge** tới Lambda để tự khắc phục. Security Hub CSPM là phần mở rộng nâng cao, SAA-C03 chỉ tập trung vào phần lõi.

> **Pattern đề thi:** *Gom finding của GuardDuty, Inspector và Macie vào một dashboard và chấm điểm tuân thủ CIS/PCI cho nhiều account* => **AWS Security Hub với Organizations và delegated administrator**.

## 6. Chọn đúng trong nhóm: bốn dịch vụ soi bốn thứ khác nhau

| Dịch vụ | Soi cái gì | Phạm vi | Câu hỏi trả lời | Keyword trong đề |
|---------|-----------|---------|-----------------|------------------|
| **GuardDuty** | Hành vi qua log | Account, EC2, S3, EKS, RDS, Lambda | Có ai đang tấn công không? | threat, malicious, compromised, unusual activity, crypto mining |
| **Inspector** | Lỗ hổng phần mềm | EC2, ECR image, Lambda | Chỗ nào có CVE cần vá? | vulnerability, CVE, patch, software flaw, network reachability |
| **Macie** | Nội dung dữ liệu | Chỉ S3 | Dữ liệu nhạy cảm nằm ở đâu? | sensitive data, PII, PHI, data classification |
| **Security Hub** | Finding của các dịch vụ khác | Nhiều dịch vụ, nhiều account | Tổng thể an toàn và tuân thủ tới đâu? | centralized findings, security score, CIS, PCI |

Đặt nhóm vào bức tranh chung: chặn SQL injection trên ALB là **preventive** (WAF); EC2 đào coin, CVE trên AMI, SSN trong bucket là **detective** (GuardDuty, Inspector, Macie); bucket public ngoài ý muốn là IAM Access Analyzer hoặc phần posture của Macie; ai đã xóa security group là **audit** (CloudTrail); security group có mở cổng 22 không là **compliance** (Config rule); báo cáo PCI là Config Conformance Pack cùng Audit Manager; không ai xóa được audit log là **preventive** (S3 Object Lock).

> **Pattern đề thi:** *Đề đưa cả GuardDuty, Inspector và Macie làm đáp án, hỏi cách phát hiện CVE trên AMI* => **Inspector**; đổi thành malware hoặc trojan trên EBS không cài agent => **GuardDuty Malware Protection**.

## 7. Kịch bản thi

1. Phát hiện EC2 đang đào tiền mã hóa hoặc liên lạc với IP độc hại. => GuardDuty.
2. Bật phát hiện mối đe dọa cho mọi account trong tổ chức và xem tập trung. => GuardDuty với delegated administrator trong Organizations.
3. EC2 có cổng 22 mở ra 0.0.0.0/0 và cần một finding về phơi nhiễm mạng. => Inspector network reachability.
4. Một CVE đã được chấp nhận rủi ro, không muốn bị cảnh báo nữa. => Suppression rule của Inspector.
5. Bucket mới tạo cần tự động được đánh giá dữ liệu nhạy cảm. => Macie automated sensitive data discovery.
6. Biết bucket đang public nhưng không cần biết bên trong có gì. => IAM Access Analyzer, không phải Macie.
7. Finding Critical phải được tự động khắc phục. => Security Hub hoặc dịch vụ nguồn => EventBridge => Lambda.
8. Điều tra nguyên nhân gốc và dựng timeline của một finding. => Amazon Detective.

## 8. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Crypto mining, IP độc hại, credential dùng từ vị trí lạ | **GuardDuty** | Inspector, Config |
| Lỗ hổng, CVE, phần mềm cần vá trên EC2, ECR, Lambda | **Inspector** | GuardDuty |
| Malware hoặc trojan trên EC2/EBS, không cài agent | **GuardDuty Malware Protection** | Inspector |
| PII, số thẻ tín dụng, hồ sơ sức khỏe trong S3 | **Macie** | GuardDuty, Security Hub |
| Dữ liệu nhạy cảm trong database hoặc EBS | **Không phải Macie** (Macie chỉ S3) | Macie |
| GuardDuty có tự chặn tấn công không | **Không**, cần EventBridge + Lambda | Cho rằng GuardDuty tự khắc phục |
| Phát hiện CVE xong cần vá | **Systems Manager Patch Manager** | Cho rằng Inspector tự vá |
| Gom finding nhiều dịch vụ và chấm điểm CIS/PCI | **Security Hub** | Mở từng console riêng, Config một mình |
| Muốn Security Hub tự phát hiện EC2 đào coin | **GuardDuty** phát hiện, Security Hub chỉ gom | Chọn Security Hub |
| Ai đã xóa S3 bucket | **CloudTrail** | Security Hub, GuardDuty |
| Security group có mở cổng 22 không | **Config rule**, finding đẩy về Security Hub | CloudTrail |
| Tài nguyên bị chia sẻ ra ngoài tổ chức | **IAM Access Analyzer** | Macie, GuardDuty |
| Bật phát hiện nhanh, không cài agent | **GuardDuty** | Inspector trên EC2 (dùng SSM Agent) |

## 9. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **GuardDuty vs Inspector vs Macie:** GuardDuty nhìn hành vi đang diễn ra, Inspector nhìn điểm yếu tĩnh trong phần mềm, còn Macie nhìn nội dung dữ liệu trong S3. Đây là phân biệt được hỏi nhiều nhất của tag này.
- **Inspector vs GuardDuty Malware Protection:** Inspector tìm lỗ hổng chưa bị khai thác theo danh mục CVE, còn Malware Protection tìm phần mềm độc hại đã nằm trên EBS. Từ khóa CVE hay patch dẫn tới Inspector, từ khóa malware hay trojan dẫn tới GuardDuty.
- **GuardDuty vs CloudTrail:** CloudTrail là nhật ký ghi lại mọi API call mà không đánh giá gì, còn GuardDuty là bộ não đọc nhật ký đó (cùng Flow Logs và DNS) để phát hiện mối đe dọa.
- **Security Hub vs AWS Config:** Config là engine kiểm tra cấu hình tài nguyên theo rule, còn Security Hub gom finding bảo mật từ nhiều nguồn và chấm điểm theo chuẩn. Config là một đầu vào của Security Hub.
- **Macie vs IAM Access Analyzer:** Macie đọc nội dung bên trong object để tìm dữ liệu nhạy cảm, còn Access Analyzer đọc policy để biết tài nguyên có bị chia sẻ ra ngoài không mà không cần xem nội dung.
- **GuardDuty vs Amazon Detective:** GuardDuty báo có chuyện xảy ra, còn Detective điều tra nguyên nhân gốc, vẽ đồ thị quan hệ và dựng timeline để biết sự cố lan tới đâu. SAA-C03 hỏi Detective khá thưa.
- **GuardDuty vs WAF và Shield:** WAF và Shield chặn tấn công ở tầng mạng và ứng dụng theo kiểu phòng ngừa, còn GuardDuty chỉ phát hiện và cảnh báo.
- **Inspector vs Patch Manager:** Inspector phát hiện lỗ hổng cần vá, còn Patch Manager thực thi việc vá. Phương án hoàn chỉnh cho câu hỏi về lỗ hổng thường có cả hai.

## 10. Câu nhớ nhanh trước khi thi

> **Bộ ba phát hiện: GuardDuty = hành vi, Inspector = lỗ hổng CVE, Macie = dữ liệu nhạy cảm trong S3. Security Hub = gom và chấm điểm.**
>
> **GuardDuty đọc VPC Flow Logs, DNS và CloudTrail, managed và không agent. Malware trên EBS không agent => GuardDuty Malware Protection.**
>
> **Inspector quét EC2, image ECR và Lambda liên tục. Inspector phát hiện, Patch Manager mới vá.**
>
> **Macie chỉ quét S3. Mẫu dữ liệu riêng => custom data identifier. Bucket bị share ra ngoài => IAM Access Analyzer.**
>
> **Cả bốn chỉ phát hiện, không tự chặn. Muốn phản ứng => EventBridge + Lambda hoặc SNS. Đa account => delegated administrator.**
>
> **CloudTrail ghi log, GuardDuty đọc log, Config kiểm tra cấu hình, Security Hub gom finding, Detective điều tra nguyên nhân gốc.**

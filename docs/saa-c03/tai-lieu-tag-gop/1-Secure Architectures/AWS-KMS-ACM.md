# AWS KMS và AWS Certificate Manager

> **Domain:** Secure Architectures (exam Domain 1). Tag: AWS-KMS / ACM (Encryption Keys and Certificates). KMS quản lý key mã hóa dữ liệu lúc lưu trữ, còn ACM cấp và tự gia hạn chứng chỉ SSL/TLS để bật HTTPS cho dữ liệu lúc truyền.
> **Mức độ ra đề:** Rất cao với KMS, xương sống mã hóa của AWS, hiếm khi hỏi trừu tượng mà gài vào S3, EBS, RDS, Secrets Manager hoặc tình huống Access Denied cross-account. Trung bình đến cao với ACM: HTTPS ít công nhất, tự gia hạn, đặt cert ở region nào. Thuật ngữ: CMK trong bài là **customer managed key**, AWS nay gọi chung mọi key là **KMS key**.
> **Cross-reference:** S3-Encryption-Policies, IAM-STS, AWS-Secrets-Manager, Amazon-CloudFront, ELB-ALB-NLB, Amazon-API-Gateway, VPC-Traffic-Control.

## 1. Tổng quan: KMS và ACM giải quyết vấn đề gì

Dữ liệu trên S3, EBS, RDS phải được mã hóa, và ai được giải mã cần được kiểm soát và audit. Cùng lúc, website chạy sau ALB hay CloudFront cần HTTPS, nghĩa là phải mua chứng chỉ, cài lên, theo dõi ngày hết hạn và gia hạn đúng lúc; quên gia hạn là website báo lỗi bảo mật. Hai bài toán này nghe giống nhau vì đều là "mã hóa", nhưng dùng hai dịch vụ khác nhau.

**AWS KMS** tạo, lưu giữ trong module phần cứng (HSM), kiểm soát truy cập và audit (qua CloudTrail) các **key mã hóa**. KMS **không lưu dữ liệu**, chỉ mã hóa trực tiếp khối **≤ 4 KB**, không quản lý secret như mật khẩu hay API key. Key chủ **không bao giờ rời KMS** ở dạng thô; mã hóa khối lớn đi qua cơ chế **envelope encryption**.

**AWS Certificate Manager (ACM)** cấp, quản lý và **tự động gia hạn** chứng chỉ SSL/TLS cho ALB, CloudFront, API Gateway. Cert public do ACM cấp **miễn phí** (chỉ trả tiền cho tài nguyên dùng nó), hỗ trợ wildcard (`*.example.com`) và nhiều domain (SAN) trong một cert, và có **ACM Private CA** cho cert nội bộ.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Envelope encryption và loại key** | Data key mã hóa dữ liệu, KMS key mã hóa data key | Hiểu throttle, audit, cross-region |
| **Key Policy, IAM, Grant** | Ba cơ chế cấp quyền dùng key | Giải các câu Access Denied |
| **Rotation và vòng đời key** | Xoay key, xóa key, alias, Multi-Region Keys | Bảo mật và DR |
| **Chứng chỉ ACM** | Validation, region, public, private, imported | HTTPS ít công, tự gia hạn |

> **Một câu định vị:** mã hóa dữ liệu lưu trữ, kiểm soát ai được giải mã => **KMS**. Chứng chỉ HTTPS/TLS => **ACM**. Lưu và tự xoay mật khẩu database => Secrets Manager. HSM riêng, FIPS 140-2 Level 3 => CloudHSM. **ACM quản CERT, KMS quản KEY.**

## 2. KMS: envelope encryption và các loại key

Khi S3 mã hóa object bằng SSE-KMS, dịch vụ gọi **`GenerateDataKey`** trên KMS key; KMS trả về data key ở hai dạng, một bản **plaintext** và một bản **đã mã hóa**. Dịch vụ dùng bản plaintext mã hóa dữ liệu cục bộ, xóa nó khỏi bộ nhớ, rồi lưu bản đã mã hóa cạnh object. Khi đọc, dịch vụ gửi data key đã mã hóa lên KMS gọi **`Decrypt`** để lấy lại plaintext và giải mã object.

Ba hệ quả thi hay hỏi. Thứ nhất, **mỗi GET/PUT SSE-KMS là một lần gọi KMS**, nguồn gốc của **throttle và chi phí**; **S3 Bucket Keys** tái dùng một data key cấp bucket, giảm khoảng 99% số lần gọi. Thứ hai, mỗi lần gọi đều ghi **CloudTrail**, nên SSE-KMS audit được còn SSE-S3 thì không. Thứ ba, data key bị khóa bởi key ở region nguồn, nên sao chép sang region khác phải **mã hóa lại bằng key ở region đích**, đó là lý do S3 Cross-Region Replication cần KMS key ở region đích.

**Customer managed key** do bạn tạo và sở hữu hoàn toàn: sửa Key Policy, bật tắt, lên lịch xóa, cấu hình rotation, tạo grant, có phí theo key mỗi tháng cộng phí API; đây là đáp án khi cần tự kiểm soát policy, lịch xoay hoặc cross-account. **AWS managed key** (`aws/s3`, `aws/ebs`...) miễn phí lưu trữ, chỉ tính phí API, nhưng **không sửa được Key Policy và rotation**. **AWS owned key** dùng chung nhiều account, bạn không thấy, không audit, không kiểm soát.

Key **symmetric** (mặc định) dùng một key cho cả mã hóa và giải mã, không bao giờ rời KMS, và là loại duy nhất chạy được `GenerateDataKey`, nên S3, EBS, RDS đều dùng symmetric. Key **asymmetric** là cặp public và private, public key tải về được, dùng khi cần **ký số (sign/verify)** hoặc khi đối tác bên ngoài không có quyền AWS cần mã hóa bằng public key.

KMS dùng HSM **multi-tenant** do AWS quản lý. **CloudHSM** là HSM **single-tenant** đạt **FIPS 140-2 Level 3**, bạn toàn quyền key material, dùng khi compliance bắt buộc HSM riêng. **Custom Key Store** là cầu nối: vẫn gọi API của KMS nhưng key material nằm trong cluster CloudHSM của bạn.

> **Pattern đề thi:** *S3 dùng SSE-KMS bị `ThrottlingException` và phí KMS tăng cao* => **bật S3 Bucket Keys**.

## 3. KMS: ai được dùng key

Có ba cơ chế cấp quyền. **Key Policy** là resource-based policy gắn ngay trên key, luôn bắt buộc và là người gác cổng cuối cùng. **IAM policy** chỉ có hiệu lực khi Key Policy **ủy quyền cho IAM** bằng dòng cho phép `arn:aws:iam::<account>:root` (cấu hình mặc định khi tạo key qua Console); thiếu dòng đó thì IAM policy dù full quyền cũng vô nghĩa. **Grant** cấp quyền **tạm thời, hạt mịn, theo chương trình**, thu hồi được mà không phải sửa policy, hợp với dịch vụ cần dùng key trong lúc xử lý.

Vì vậy user có IAM `kms:Decrypt` với `"Resource":"*"` vẫn có thể **Access Denied**, và cách sửa là **Key Policy**, không phải IAM. Để account B dùng key của account A cần đủ hai phía: **Key Policy của A** cho phép principal của B (hoặc `<B-account>:root`), và **IAM policy ở B** cho phép gọi `kms:Decrypt` hoặc `kms:GenerateDataKey` trên ARN key của A; thiếu phía Key Policy là lỗi hay gặp nhất.

Điều kiện **`kms:ViaService`** trong Key Policy giới hạn key chỉ được dùng khi request đến từ một dịch vụ cụ thể (ví dụ `s3.<region>.amazonaws.com`), thường kết hợp `kms:CallerAccount`, để không ai gọi `Encrypt` hay `Decrypt` trực tiếp lên key.

> **Pattern đề thi:** *Account B đọc object SSE-KMS của account A bị Access Denied dù IAM ở B đã cho `kms:Decrypt`* => **Key Policy của account A chưa mở cho account B**.

## 4. KMS: rotation, vòng đời và tích hợp dịch vụ

**Automatic rotation** trên customer managed key mặc định **1 năm**, nay cấu hình được từ khoảng 90 ngày đến nhiều năm; nó **giữ nguyên Key ID và ARN**, chỉ đổi backing material và giữ phiên bản cũ để giải mã dữ liệu cũ, nên **không phải mã hóa lại dữ liệu hay sửa ứng dụng**. **Manual rotation** là tạo key mới rồi trỏ **alias** sang. AWS managed key được AWS tự xoay khoảng 1 năm, không đổi được. **Imported key material không có automatic rotation**, phải tự import key mới. Rotation phục vụ bảo mật, khác Bucket Keys phục vụ throttle và chi phí.

Không xóa key ngay được: phải **schedule deletion** với thời gian chờ **7 đến 30 ngày** (mặc định 30) và **hủy được** trong thời gian này; sau khi xóa thật, dữ liệu mã hóa bằng key đó **mất vĩnh viễn**. Muốn tạm ngưng thì **Disable key**, đảo ngược tức thì. **Multi-Region Keys** là các bản sao ở nhiều region **chia sẻ key material** nên giải mã chéo region được mà không gọi chéo; mỗi bản sao vẫn có Key ID, ARN và Key Policy riêng, rotation đồng bộ từ key chính. Key thường thì độc lập theo region, ciphertext không dùng chéo được.

**EBS** bật được mã hóa mặc định cho account; copy snapshot sang region khác sẽ mã hóa lại bằng key region đích. **Không mã hóa trực tiếp** EBS volume hay RDS instance đang tồn tại: phải **snapshot => copy snapshot có bật mã hóa => tạo volume mới hoặc restore**; chiều gỡ mã hóa cũng không có đường trực tiếp. **Secrets Manager** lưu và **tự xoay secret**, bản thân secret được mã hóa bằng KMS; Parameter Store SecureString cũng mã hóa bằng KMS nhưng không tự xoay. **KMS xoay KEY, Secrets Manager xoay SECRET.**

> **Pattern đề thi:** *Cần xoay key định kỳ mà không phải mã hóa lại dữ liệu hay đổi cấu hình ứng dụng* => **bật automatic key rotation trên customer managed key**.

## 5. ACM: validation, nơi gắn cert và region

Để cấp cert public, ACM bắt chứng minh sở hữu domain. **DNS validation** thêm một bản ghi CNAME và **tự gia hạn được** miễn bản ghi còn đó; nếu domain nằm ở Route 53 thì ACM tự thêm CNAME gần như một click. **Email validation** gửi mail tới địa chỉ admin của domain, lúc gia hạn phải thao tác lại nên dễ lỡ.

ACM gắn cert vào các dịch vụ **terminate TLS**: ALB, NLB khi dùng **TLS listener** (NLB ở chế độ TCP passthrough thì cert nằm ở backend), CloudFront, API Gateway, cùng App Runner và Elastic Beanstalk qua ELB nền. **Không export được private key của cert public** do ACM cấp, nên muốn HTTPS cho EC2 phải đặt **ALB hoặc CloudFront phía trước** và gắn cert ở đó; chỉ cert từ **ACM Private CA** mới export được.

Cert ACM là **tài nguyên regional**, chỉ gắn được vào resource cùng region. Cert cho **CloudFront bắt buộc nằm ở `us-east-1`** bất kể origin ở đâu, vì CloudFront là dịch vụ global; cert cho ALB hay API Gateway regional phải **cùng region với resource** (API Gateway edge-optimized đi qua CloudFront nên cũng dùng cert ở `us-east-1`).

Cert **public** do ACM cấp miễn phí và tự gia hạn. Cert từ **ACM Private CA** có phí, dành cho hạ tầng **nội bộ** như microservice với microservice, thiết bị nội bộ. Cert **imported** mua từ CA bên ngoài **không tự gia hạn**, phải tự theo dõi và import lại.

> **Pattern đề thi:** *Gắn cert ACM cho CloudFront nhưng không thấy cert trong danh sách chọn* => **cert không nằm ở `us-east-1`, tạo lại cert ở đó**.

## 6. Chọn đúng trong nhóm: KMS hay ACM

| Khía cạnh | AWS KMS | ACM |
|-----------|---------|-----|
| Quản lý gì | Key mã hóa dữ liệu lưu trữ | Chứng chỉ TLS cho dữ liệu lúc truyền và danh tính server |
| Tự động hóa vòng đời | Automatic rotation, giữ nguyên ARN | Tự gia hạn cert do ACM cấp |
| Ngoại lệ không tự động | Imported key material | Imported certificate |
| Phạm vi region | Regional, trừ Multi-Region Keys | Regional, CloudFront luôn lấy cert ở `us-east-1` |
| Xuất ra ngoài | Key không rời KMS (chỉ public key của asymmetric) | Không export private key của cert public (Private CA thì được) |
| Chi phí | Customer managed key tính phí theo key và API | Cert public miễn phí, Private CA có phí |

Ba cơ chế "tự động" hay bị trộn trong đáp án: **KMS xoay KEY**, **ACM gia hạn CERT**, **Secrets Manager xoay SECRET**. Và hai lớp khác nhau của cùng yêu cầu bảo mật: ép HTTPS bằng `aws:SecureTransport` là tầng policy, còn ACM là tầng cung cấp cert.

> **Pattern đề thi:** *Mã hóa dữ liệu lúc truyền giữa người dùng và ALB, đồng thời mã hóa dữ liệu lưu trên EBS phía sau* => **cert ACM gắn trên ALB cho HTTPS, và KMS key cho EBS**.

## 7. Kịch bản thi

1. Bật HTTPS cho web ít công nhất, miễn phí, không lo hết hạn. => Cert public của ACM gắn lên ALB hoặc CloudFront, dùng DNS validation.
2. Cert import vào ACM vẫn hết hạn. => Imported cert không tự gia hạn, phải import lại.
3. Cần cert cho microservice nội bộ, không công khai ra Internet. => ACM Private CA.
4. Mã hóa RDS đang chạy chưa mã hóa. => Snapshot, copy snapshot có mã hóa, rồi restore.
5. Cần cùng một key giải mã được ở region DR. => Multi-Region Keys.
6. Lỡ schedule deletion một key đang dùng. => Hủy lệnh xóa trong thời gian chờ 7 đến 30 ngày.
7. Compliance bắt buộc HSM riêng, FIPS 140-2 Level 3. => CloudHSM, hoặc KMS Custom Key Store backed by CloudHSM.
8. Chỉ cho key được dùng thông qua S3, cấm gọi KMS trực tiếp. => Điều kiện `kms:ViaService` trong Key Policy.

## 8. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| IAM full `kms:Decrypt` vẫn Access Denied | **Key Policy** chưa cho phép hoặc chưa ủy quyền qua `:root` | Sửa tiếp IAM policy |
| Object lớn mã hóa bằng KMS thế nào | **Envelope encryption** với data key | Gửi cả khối lên KMS |
| Import key material và muốn tự xoay | **Không có** automatic rotation, import key mới thủ công | Bật automatic rotation |
| Cần ký số hoặc đối tác ngoài mã hóa bằng public key | **Asymmetric key** | Symmetric key |
| Cấp quyền dùng key tạm thời, thu hồi được | **Grant** | Sửa Key Policy mỗi lần |
| Tạm ngưng dùng key mà không xóa | **Disable key** | Schedule deletion |
| Lưu và tự xoay mật khẩu database | **Secrets Manager** | KMS, Parameter Store |
| Mã hóa hoặc gỡ mã hóa EBS volume đang có | **Snapshot => copy có mã hóa => volume mới**; gỡ thì không có đường trực tiếp | Bật mã hóa thẳng trên volume |
| Replication SSE-KMS sang region khác bị lỗi | Thiếu **KMS key ở region đích** và quyền của replication role trên cả hai key | Dùng lại key region nguồn |
| Cert tự gia hạn không cần thao tác | **DNS validation** | Email validation |
| HTTPS cho ứng dụng trên EC2 bằng ACM | **ALB phía trước**, cert trên ALB | Cài cert ACM thẳng lên EC2 |
| Cert cho ALB ở `ap-southeast-1` | Cert **cùng region** với ALB | Tạo ở `us-east-1` như CloudFront |
| Cần export private key để cài nơi khác | Chỉ **Private CA** cho phép | Cert public của ACM |

## 9. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **KMS vs ACM:** KMS quản lý key để mã hóa dữ liệu, còn ACM quản lý chứng chỉ TLS để bật HTTPS và xác thực server. Đừng chọn KMS cho bài toán cert, cũng đừng chọn ACM cho bài toán mã hóa ổ đĩa.
- **KMS vs Secrets Manager:** KMS quản lý và xoay key, còn Secrets Manager lưu và xoay secret như mật khẩu hay API key. Secret được mã hóa bằng KMS, nên hai dịch vụ bổ trợ chứ không thay thế nhau.
- **KMS vs CloudHSM:** KMS dùng HSM multi-tenant do AWS quản lý và tiện lợi, còn CloudHSM là HSM single-tenant của riêng bạn đạt FIPS 140-2 Level 3.
- **Customer managed key vs AWS managed key:** customer managed key cho sửa Key Policy, chỉnh rotation và dùng cross-account; AWS managed key miễn phí lưu trữ nhưng không tùy chỉnh được gì.
- **Automatic rotation vs manual rotation vs S3 Bucket Keys:** automatic rotation đổi backing material mà giữ ARN, manual rotation tạo key mới rồi trỏ alias, còn Bucket Keys chỉ giảm số lần gọi KMS vì mục đích throttle và chi phí.
- **ACM public cert vs Private CA vs imported cert:** cert public miễn phí và tự gia hạn cho Internet, Private CA có phí cho hạ tầng nội bộ, còn cert imported không bao giờ tự gia hạn.
- **Single-region key vs Multi-Region Keys:** key thường độc lập theo region nên ciphertext không dùng chéo được, còn Multi-Region Keys chia sẻ key material để giải mã chéo region.

## 10. Câu nhớ nhanh trước khi thi

> **KMS quản KEY, không lưu DATA, không xoay SECRET. ACM quản CERT. Mật khẩu database tự xoay => Secrets Manager.**
>
> **Envelope encryption: mỗi GET/PUT SSE-KMS là một lần gọi KMS => throttle => S3 Bucket Keys.**
>
> **Customer managed key phải đậu cả Key Policy lẫn IAM. Cross-account Access Denied => Key Policy của chủ key.**
>
> **Automatic rotation giữ nguyên ARN. Imported key không tự xoay. Xóa key chờ 7 đến 30 ngày, tạm ngưng thì Disable.**
>
> **ACM public cert miễn phí, tự gia hạn với DNS validation. Imported cert không tự gia hạn. Nội bộ => Private CA.**
>
> **CloudFront => cert ở `us-east-1`. ALB => cert cùng region. EC2 muốn HTTPS => đặt ALB phía trước.**

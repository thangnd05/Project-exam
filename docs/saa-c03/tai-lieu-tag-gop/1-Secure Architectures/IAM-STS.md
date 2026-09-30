# AWS IAM và AWS STS

> **Domain:** Secure Architectures (exam Domain 1). Tag: IAM / AWS-STS (Identity and Access Management / Security Token Service). IAM định nghĩa ai được làm gì trên tài nguyên nào, còn STS phát hành credential tạm thời để dùng quyền của một role mà không cần access key dài hạn.
> **Mức độ ra đề:** Rất cao. IAM xuất hiện trực tiếp hoặc gián tiếp trong phần lớn câu hỏi bảo mật, kể cả câu về S3 và KMS; STS đứng sau mọi câu về quyền tạm thời, cross-account và federation. Trọng tâm là evaluation logic, Role thay cho access key, SCP và Permissions Boundary, Role Chaining, ExternalId và chọn đúng API của STS.
> **Cross-reference:** IAM-Identity-Center-Directory-Service, Amazon-Cognito, AWS-KMS-ACM, S3-Encryption-Policies, Threat-Detection, AWS-Audit-Logging.

## 1. Tổng quan: IAM và STS giải quyết vấn đề gì

Một ứng dụng trên EC2 cần đọc S3, một nhà cung cấp SaaS cần quản lý account của bạn, nhân viên muốn đăng nhập AWS bằng tài khoản công ty, và một server trong trung tâm dữ liệu cần gọi API AWS. Cách tệ nhất là phát cho mỗi bên một access key cố định: key không tự hết hạn, hay bị nhúng cứng vào code, và lộ ra là mất quyền kiểm soát.

**IAM** trả lời câu hỏi cốt lõi: **Principal nào** được **thực hiện Action nào** trên **Resource nào**, với **Condition nào**. Mọi request mặc định bị từ chối, và nguyên tắc xuyên suốt là **least privilege**: khi nhiều đáp án đều đúng kỹ thuật, chọn cái cấp **ít quyền nhất** mà vẫn đủ dùng.

**STS** phát hành **temporary security credentials** gồm Access Key ID, Secret Access Key và **Session Token**, cả ba **tự hết hạn** (15 phút đến 12 giờ với các API `AssumeRole*`). STS là dịch vụ global nhưng nên gọi regional endpoint để giảm độ trễ và tăng khả dụng. Role là *danh tính*, STS là *cơ chế* phát hành credential để dùng role đó.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Principals** | IAM User, Group, Role | Ai đang yêu cầu truy cập |
| **Policies** | Identity-based, resource-based, SCP, Permissions Boundary, session policy | Cấp quyền hoặc đặt trần quyền |
| **Evaluation logic** | Quy tắc gộp mọi policy | Quyết định cuối cùng Allow hay Deny |
| **STS** | `AssumeRole`, `AssumeRoleWithSAML`, `AssumeRoleWithWebIdentity`, `GetSessionToken` | Cấp quyền tạm thời, không cần key dài hạn |

> **Một câu định vị:** cấp quyền cho EC2, Lambda, ECS => **IAM Role**. Hỏi cơ chế lấy credential tạm thời, federation hay thời hạn session => **STS** và đúng API. Đặt trần quyền cho cả account => **SCP**. Nhân viên SSO vào nhiều account => IAM Identity Center. Người dùng cuối của app => Cognito. Cần Active Directory => Directory Service.

## 2. IAM: User, Group và Role

**IAM User** đại diện cho một người hoặc ứng dụng cụ thể, có mật khẩu Console và/hoặc **access key dài hạn** không tự hết hạn, nên đáp án nhúng access key vào ứng dụng gần như luôn sai. **IAM Group** là tập hợp user để gắn policy chung cho nhiều người giống nhau; group **không phải principal** (không assume được, không đặt làm `Principal` trong resource policy) và **không lồng nhau**.

**IAM Role** là danh tính có quyền nhưng không gắn cứng với ai, không có mật khẩu hay key cố định; ai được phép thì assume để nhận credential tạm thời qua STS. Đây là cách AWS khuyến nghị cho EC2 (qua **instance profile**), Lambda (**execution role**), ECS (**task role**), cho **cross-account** và cho **federated users**. Mỗi role có hai policy: **trust policy** là resource-based policy nói *ai được assume* (có `Principal`), còn **permission policy** nói *role làm được gì*; cross-account cần đúng cả hai.

**IAM Roles Anywhere** cho workload **ngoài AWS (on-prem)** lấy credential tạm thời bằng **chứng chỉ X.509**, khác instance profile vốn chỉ dành cho EC2 trong AWS. **Service-linked role** do chính dịch vụ AWS (ELB, Auto Scaling...) tạo và quản lý. Muốn gán role cho Lambda, EC2, ECS hay CloudFormation, principal thực hiện việc gán cần **`iam:PassRole`** chỉ trên ARN role cụ thể (không cấp `iam:*` hay `AdministratorAccess`, và `cloudformation:*` một mình là không đủ), còn trust policy của role phải cho dịch vụ đó assume.

> **Pattern đề thi:** *Ứng dụng trên EC2 cần truy cập S3 một cách an toàn nhất* => **gán IAM Role cho EC2 qua instance profile**, STS tự cấp và tự xoay credential, không tạo access key.

## 3. IAM: Policy và evaluation logic

**Identity-based policy** gắn vào User, Group hoặc Role và không có `Principal`. Loại **managed** (AWS managed như `AmazonS3ReadOnlyAccess`, hoặc customer managed) tái sử dụng được và có versioning; loại **inline** gắn 1-1, không tái sử dụng, không versioning, xóa danh tính là mất theo. **Resource-based policy** gắn vào S3 bucket, SQS, SNS, KMS key, Lambda, bắt buộc có `Principal` và là cách chính để cấp quyền cross-account; ACL là cơ chế cũ nên tránh. Condition key hay gặp: `aws:MultiFactorAuthPresent` và `aws:MultiFactorAuthAge` (bắt MFA), `aws:SourceIp` (giới hạn dải IP), `aws:PrincipalOrgID` (chỉ principal trong Organization, không cần liệt kê account ID), `aws:RequestedRegion` (giới hạn region).

**SCP** đặt trần quyền cho account trong **AWS Organizations**, **không cấp quyền** và không áp cho management account: SCP cho phép `s3:*` thì user vẫn cần IAM policy cấp quyền, còn SCP Deny thì không IAM policy nào vượt qua. Ví dụ điển hình là Deny mọi action ngoài danh sách `aws:RequestedRegion`, Deny `s3:PutObject` không kèm mã hóa SSE, hoặc Deny `ec2:RunInstances` với instance type đắt. **Permissions Boundary** đặt trần cho **một user hoặc role**, quyền thực là phần giao giữa boundary và identity policy. **Session policy** truyền lúc gọi AssumeRole để thu hẹp quyền của riêng phiên đó.

**ABAC** giải bài toán mở rộng khi RBAC (mỗi nhóm một role hoặc policy) quá tải: một policy duy nhất với điều kiện `aws:ResourceTag/Project` bằng `${aws:PrincipalTag/Project}`, thêm dự án mới chỉ cần gắn tag mà không sửa policy. RBAC hợp cấu trúc quyền ổn định; ABAC hợp môi trường nhiều team, dự án thay đổi liên tục.

**Evaluation logic:** mặc định là implicit deny; chỉ cần **một explicit Deny** ở bất kỳ đâu (identity policy, resource policy, SCP, boundary) là bị từ chối, nên **Explicit Deny > Explicit Allow > Implicit Deny**. Khi nhiều lớp cùng áp dụng, quyền hiệu lực là **phần giao** của SCP, boundary và identity (hoặc resource) policy. Trong **cùng account**, chỉ cần identity policy **hoặc** resource policy cho phép (đúng với S3, SQS, SNS); **cross-account** cần **cả hai**. Ngoại lệ chết người là **KMS key**: dù cùng account và IAM cho `kms:*`, nếu **Key Policy** không cho phép principal (hoặc không ủy quyền cho account qua dòng root) thì vẫn Access Denied.

Để audit, **IAM Access Analyzer** quét resource-based policy (S3, KMS, IAM Role, SQS, Lambda...) và cảnh báo tài nguyên đang chia sẻ với principal **ngoài** account hoặc Organization. **Access Advisor** (last-accessed data) cho biết lần cuối từng service được dùng để gỡ quyền dư, còn **Credential Report** là file CSV về trạng thái MFA, tuổi access key và mật khẩu của mọi user, phục vụ xoay key định kỳ.

> **Pattern đề thi:** *User có IAM Allow nhưng vẫn Access Denied* => **có explicit Deny ở SCP, Permissions Boundary hoặc policy khác**; nếu là KMS key thì **Key Policy chưa cho phép**.

## 4. STS: credential tạm thời, federation và các giới hạn

| API | Dùng cho | Nguồn danh tính |
|-----|----------|-----------------|
| **AssumeRole** | Cross-account hoặc đổi vai trong cùng account | User hoặc role đã có trong AWS |
| **AssumeRoleWithSAML** | Federation doanh nghiệp qua SAML 2.0 | IdP như AD FS, Okta |
| **AssumeRoleWithWebIdentity** | Người dùng cuối của app web/mobile qua OIDC | Google, Facebook, Cognito |
| **GetSessionToken** | Credential tạm thời cho chính IAM user, thường kèm MFA | Chính IAM user đó |
| **GetFederationToken** | Federation cho user không phải IAM (ít gặp) | IAM user hoặc app |

`AssumeRole` cần hai điều kiện khớp nhau: **trust policy** của role cho phép người gọi, và identity policy của người gọi có **`sts:AssumeRole`**; thiếu một trong hai là không assume được. Với federation, nhân viên dùng IdP doanh nghiệp => **SAML**, người dùng cuối đăng nhập mạng xã hội => **WebIdentity** (thường qua Cognito Identity Pool). Trust policy của federation dùng **`Principal: Federated`** (ARN của SAML hoặc OIDC provider), không phải `Principal: AWS`. Khi có nhiều account và nhiều nhân viên, AWS khuyến nghị **IAM Identity Center** thay vì dựng SAML riêng cho từng account; SAML trực tiếp chỉ hợp khi có một hoặc ít account.

Credential của role mặc định sống **1 giờ**, tăng tối đa **12 giờ** qua `MaxSessionDuration`; `GetSessionToken` thì từ 15 phút đến 36 giờ (mặc định 12 giờ, root user tối đa 1 giờ). **Role Chaining**, tức dùng credential của Role A để assume tiếp Role B, bị giới hạn cứng **tối đa 1 giờ** dù `MaxSessionDuration` đặt 12 giờ; cách xử lý là assume thẳng role đích hoặc thiết kế để refresh credential.

Khi cho **bên thứ ba** assume role cross-account, rủi ro **Confused Deputy** là kẻ xấu biết ARN role của bạn và lừa bên thứ ba assume nhầm vào account bạn; giải pháp là trust policy thêm điều kiện **`sts:ExternalId`** với chuỗi bí mật riêng. Role nhạy cảm có thể bắt **MFA** bằng `aws:MultiFactorAuthPresent: true` trong trust policy. **Session tags** (`sts:TagSession`) truyền lúc assume sẽ trở thành `aws:PrincipalTag` của phiên, dùng cho ABAC.

> **Pattern đề thi:** *Workload chạy hơn 1 giờ qua nhiều role bị hết hạn credential dù đã đặt 12 giờ* => **Role Chaining giới hạn cứng 1 giờ**.

## 5. Chọn đúng trong nhóm IAM / STS

Câu hỏi của tag này hay cho "IAM Role" và "STS" cùng xuất hiện trong đáp án. Đề hỏi *cấp quyền cho dịch vụ* thì chọn Role (STS chạy ngầm phía sau), còn đề hỏi *cơ chế, API hay thời hạn session* thì chọn STS và đúng API. Bảng dưới gom các ngữ cảnh cần quyền, điểm chung là không bao giờ nhúng access key dài hạn:

| Ngữ cảnh | Giải pháp đúng | Keyword |
|----------|----------------|---------|
| EC2, Lambda, ECS gọi dịch vụ khác | **IAM Role** (instance profile, execution role, task role) | no hard-coded credentials |
| Account B dùng tài nguyên account A | **AssumeRole** cross-account, hoặc resource-based policy | cross-account |
| Nhân viên, một vài account, IdP doanh nghiệp | **AssumeRoleWithSAML** | SAML, AD FS |
| Nhân viên, nhiều account | **IAM Identity Center** (STS phía sau) | SSO, centralized access |
| Người dùng cuối của app gọi thẳng S3, DynamoDB | **Cognito Identity Pool** + `AssumeRoleWithWebIdentity` | federated, mobile |
| Server on-prem gọi API AWS | **IAM Roles Anywhere** (X.509) | on-premises, no long-term key |
| IAM user cần credential tạm thời có MFA | **GetSessionToken** | MFA, CLI |

> **Pattern đề thi:** *Thuê bên thứ ba quản lý AWS qua cross-account role, cần an toàn tối đa trước rủi ro từ phía họ* => **IAM Role với điều kiện `sts:ExternalId`** trong trust policy.

## 6. Kịch bản thi

1. Hàng trăm dự án và nhân viên mới liên tục, muốn ít phải sửa policy nhất. => ABAC với `aws:PrincipalTag` khớp `aws:ResourceTag`.
2. Chặn mọi account trong tổ chức tạo tài nguyên ngoài hai region cho phép. => SCP Deny với `aws:RequestedRegion`.
3. Cho dev tự tạo role nhưng không được vượt quá một mức quyền. => Permissions Boundary.
4. Dev deploy Lambda cần gán execution role với quyền tối thiểu. => `iam:PassRole` chỉ trên ARN role đó.
5. App mobile cho người dùng đăng nhập Google rồi upload ảnh lên S3. => Cognito Identity Pool gọi `AssumeRoleWithWebIdentity`.
6. Server on-prem gọi API AWS mà không dùng access key dài hạn. => IAM Roles Anywhere.
7. Tự động tìm tài nguyên đang bị share cho account lạ hoặc công khai. => IAM Access Analyzer.

## 7. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| EC2 hoặc Lambda cần gọi S3 | **IAM Role** (instance profile, execution role) | Access key trong code hoặc biến môi trường |
| SCP cho phép `s3:*` nhưng user vẫn không làm được | Cần **IAM policy** cấp quyền thật | Nghĩ SCP cấp quyền |
| Cross-account gọi tài nguyên | Cần **cả** identity policy bên gọi **và** resource policy bên tài nguyên | Chỉ sửa một phía |
| Account khác không assume được role | Thiếu **trust policy** hoặc thiếu `sts:AssumeRole` bên gọi | Sửa permission policy của role |
| Cùng account, IAM cho `kms:*` vẫn Access Denied | **KMS Key Policy** chưa cho phép | Áp quy tắc "một trong hai" như S3 |
| Tăng `MaxSessionDuration` lên 12 giờ vẫn hết hạn sau 1 giờ | **Role Chaining** | Tăng tiếp duration |
| Federation qua SAML hoặc OIDC | Trust policy dùng **`Principal: Federated`** | `Principal: AWS` |
| Nhiều account, nhiều nhân viên cần SSO | **IAM Identity Center** | Dựng SAML từng account, tạo IAM User |
| Chỉ cho assume role admin khi đã xác thực MFA | Trust policy có **`aws:MultiFactorAuthPresent: true`** | Chỉ bật MFA cho user |
| Gỡ quyền không dùng tới | **Access Advisor** | Credential Report |
| Audit MFA và tuổi access key của mọi user | **Credential Report** | Access Analyzer |
| Quản lý GuardDuty, Security Hub cho mọi account | **Delegated administrator** trong Organizations | Bật tay từng account |

## 8. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **IAM Role vs IAM User:** Role mang quyền tạm thời qua STS và không có credential cố định, còn User có credential dài hạn nên rủi ro hơn. Với ứng dụng hay dịch vụ, luôn ưu tiên Role.
- **SCP vs Permissions Boundary:** SCP đặt trần cho cả account hoặc OU trong Organizations, còn Permissions Boundary đặt trần cho một user hoặc role. Cả hai chỉ giới hạn, không bao giờ cấp quyền.
- **Identity-based vs Resource-based policy:** identity-based gắn vào danh tính và không có `Principal`, còn resource-based gắn vào tài nguyên, bắt buộc có `Principal` và là cách chính để làm cross-account.
- **AssumeRole vs AssumeRoleWithSAML vs AssumeRoleWithWebIdentity:** trong AWS hoặc cross-account dùng AssumeRole, nhân viên qua IdP doanh nghiệp dùng SAML, người dùng cuối của app qua mạng xã hội hoặc OIDC dùng WebIdentity.
- **Instance profile vs Roles Anywhere:** instance profile dành cho EC2 bên trong AWS, còn Roles Anywhere dành cho workload bên ngoài AWS xác thực bằng chứng chỉ X.509.
- **STS vs IAM Identity Center vs Cognito:** STS là cơ chế cấp credential ở tầng thấp. Identity Center là lớp SSO đa account cho nhân viên, Cognito Identity Pool là lớp trung gian cho người dùng cuối, và cả hai đều gọi STS phía sau.
- **IAM Access Analyzer vs GuardDuty vs Macie:** Access Analyzer soi policy để biết tài nguyên có bị chia sẻ ra ngoài không, GuardDuty soi hành vi tấn công, còn Macie soi dữ liệu nhạy cảm trong S3.

## 9. Câu nhớ nhanh trước khi thi

> **Một request = Principal + Action + Resource + Condition. Nhiều đáp án đúng thì chọn cái ít quyền nhất.**
>
> **Explicit Deny > Explicit Allow > Implicit Deny. Cross-account cần cả hai phía; với KMS key thì Key Policy luôn phải cho phép.**
>
> **SCP và Permissions Boundary chỉ đặt trần, không cấp quyền. Nhiều người nhiều dự án thay đổi liên tục => ABAC.**
>
> **EC2, Lambda, ECS => IAM Role. On-prem không key dài hạn => Roles Anywhere. Gán role cho dịch vụ => `iam:PassRole`.**
>
> **STS = AccessKey + Secret + SessionToken, tự hết hạn. Mặc định 1 giờ, tối đa 12 giờ, Role Chaining tối đa 1 giờ.**
>
> **SAML = nhân viên, WebIdentity = người dùng cuối, federation dùng `Principal: Federated`. Nhiều account => Identity Center.**
>
> **Bên thứ ba assume role => `sts:ExternalId`. Share ra ngoài => Access Analyzer. Quyền dư => Access Advisor.**

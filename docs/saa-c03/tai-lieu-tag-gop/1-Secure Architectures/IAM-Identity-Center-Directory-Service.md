# AWS IAM Identity Center và AWS Directory Service

> **Domain:** Secure Architectures (exam Domain 1). Tag: IAM-Identity-Center / AWS-Directory-Service (Federation and SSO). Identity Center là cổng đăng nhập một lần cho nhân viên vào nhiều AWS account và ứng dụng SaaS, còn Directory Service cung cấp Active Directory được quản lý trên AWS hoặc nối tới AD on-prem.
> **Mức độ ra đề:** Cao với Identity Center (keyword *SSO, multi-account, centralized access, workforce*), trung bình với Directory Service (tích hợp AD on-prem, chạy ứng dụng Windows, chọn đúng loại directory). Hai dịch vụ hay đi cặp với nhau và với EC2 Windows, RDS SQL Server, WorkSpaces; bẫy lớn là nhầm với IAM User, Cognito và IAM Role.
> **Cross-reference:** IAM-STS, Amazon-Cognito, AWS-Audit-Logging.

## 1. Tổng quan: Identity Center và Directory Service giải quyết vấn đề gì

Một công ty có 50 AWS account, vài trăm nhân viên đang đăng nhập máy tính bằng Active Directory, và một loạt ứng dụng Windows cần domain. Nếu tạo IAM User cho từng người ở từng account thì credential rải rác, onboarding và offboarding chậm, không ai audit được ai đã vào account nào. Nếu tự dựng domain controller trên AWS thì lại tốn công vận hành.

**IAM Identity Center** (trước đây là AWS SSO) cho **workforce** (nhân viên, admin) đăng nhập một lần để vào nhiều AWS account và nhiều ứng dụng SaaS. Dịch vụ này bật trong AWS Organizations, lấy người dùng từ một **identity source**, gán quyền qua **permission set**, và cấp credential tạm thời qua STS.

**AWS Directory Service** cung cấp thư mục danh tính kiểu **Microsoft Active Directory** được quản lý, để xác thực người dùng và máy, áp Group Policy, chạy ứng dụng phụ thuộc AD, hoặc chuyển tiếp xác thực về AD on-prem. Hai dịch vụ bổ trợ nhau: AD là **kho danh tính**, Identity Center là **cổng truy cập đa account**, và Identity Center có thể dùng AD làm identity source.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Identity source** | Identity Center store, External IdP (Okta, Azure AD) qua SAML 2.0, hoặc AD qua Directory Service | Nơi chứa người dùng để đăng nhập SSO |
| **Permission set + account assignment** | Bộ IAM policy, ghép user/group với permission set và account | Quyết định ai vào account nào với quyền gì |
| **Ba loại directory** | AWS Managed Microsoft AD, AD Connector, Simple AD | Chọn đúng loại theo nhu cầu AD |
| **Mô hình nối AD on-prem** | AD Connector, Managed AD kèm trust, hoặc tự cài AD trên EC2 | Một danh tính cho cả on-prem và AWS |

> **Một câu định vị:** nhân viên cần SSO vào nhiều account hoặc SaaS => **IAM Identity Center**. Cần Active Directory (domain join, Group Policy, ứng dụng phụ thuộc AD) => **Directory Service**. Người dùng cuối của app => Cognito. EC2 hay Lambda cần quyền => IAM Role. Quyền vận hành AWS trong một account => IAM.

## 2. IAM Identity Center

Luồng đăng nhập là: người dùng vào **portal** của Identity Center, chọn account, Identity Center assume một role tạm qua **STS**, rồi người dùng vào Console hoặc API. **Permission set** là bộ IAM policy được gán khi người dùng vào một account qua SSO; **account assignment** ghép user hoặc group với permission set và account cụ thể; **application assignment** cho SSO vào ứng dụng SaaS như Salesforce, Microsoft 365 qua SAML. Quản lý theo group giúp onboarding và offboarding nhanh, còn việc ai đã vào account nào được ghi lại trong **CloudTrail** qua các sự kiện AssumeRole.

Identity Center nên dùng cùng **AWS Organizations** để quản lý account tập trung. **SCP vẫn áp dụng** sau khi người dùng assume role qua permission set, nên SCP Deny thắng cả permission set Administrator. Có thể chỉ định **delegated admin** để quản lý Identity Center từ một member account thay vì management account.

Vẫn có thể federate SAML trực tiếp vào IAM của từng account (`AssumeRoleWithSAML`), cách này chỉ hợp khi có một hoặc ít account. Với nhiều account, **Identity Center là cách AWS khuyến nghị** vì ít vận hành hơn và vẫn dùng STS phía sau.

> **Pattern đề thi:** *Nhân viên đăng nhập một lần để vào 50 AWS account, dev chỉ được vào staging còn admin vào prod* => **IAM Identity Center với permission set khác nhau và account assignment theo group**.

## 3. AWS Directory Service

| Loại | Bản chất | Dùng khi |
|------|----------|----------|
| **AWS Managed Microsoft AD** | **AD thật của Microsoft**, AWS quản lý, chạy trong VPC | Cần đủ tính năng AD: Group Policy, trust với AD on-prem, ứng dụng cần schema AD thật như SharePoint, SQL Server, .NET |
| **AD Connector** | **Proxy** chuyển yêu cầu xác thực về AD on-prem, **không lưu** danh tính trên AWS | Đã có AD on-prem, chỉ muốn dịch vụ AWS xác thực qua nó mà không nhân bản directory lên cloud |
| **Simple AD** | AD tối giản dựa trên Samba, tính năng hạn chế | Ít user, nhu cầu cơ bản, chi phí thấp, không cần trust với AD thật |

Cách nhớ: Managed Microsoft AD là AD thật và mạnh nhất, AD Connector là cầu nối về on-prem, Simple AD là AD rẻ và nhẹ. Đề nhắc **trust hai chiều** hoặc **schema AD thật** => Managed Microsoft AD; đề nói **đã có AD on-prem, không muốn nhân bản hay di trú danh tính** => AD Connector; đề nói **ít user, cơ bản, rẻ** => Simple AD.

### 3.1. Nối AD on-prem và các ngữ cảnh ra đề

Có ba mô hình nối AD on-prem. **AD Connector** giữ việc xác thực ở on-prem, nhẹ và không đồng bộ dữ liệu, hợp khi AD on-prem là nguồn sự thật duy nhất. **Managed Microsoft AD kèm trust relationship** dựng AD thật trên AWS rồi thiết lập trust với on-prem, mỗi bên giữ directory riêng nhưng người dùng hai bên truy cập được tài nguyên của nhau. **Tự cài domain controller trên EC2** chỉ chọn khi cần kiểm soát tuyệt đối, vì đề thường ưu tiên dịch vụ managed.

Directory Service xuất hiện trong đề qua các ngữ cảnh: **EC2 Windows join domain** (thường dùng Managed Microsoft AD), **RDS SQL Server Windows Authentication** (bắt buộc Managed Microsoft AD, AD Connector không đủ), **Amazon WorkSpaces và AppStream** cần directory để người dùng đăng nhập (Managed AD hoặc AD Connector tùy việc đã có AD on-prem), và làm **identity source** cho IAM Identity Center.

> **Pattern đề thi:** *RDS SQL Server cần Windows Authentication và ứng dụng cần trust hai chiều với AD on-prem* => **AWS Managed Microsoft AD**.

## 4. Chọn đúng trong nhóm: cổng SSO hay kho danh tính

Quy tắc phân vai: Identity Center trả lời câu hỏi *vào account hoặc ứng dụng nào, với quyền gì*; Directory Service trả lời câu hỏi *danh tính AD nằm ở đâu và xác thực thế nào*. Directory Service không tự cấp quyền AWS, nó chỉ cung cấp danh tính để dịch vụ khác xác thực.

| Nhu cầu trong đề | Đáp án | Lý do |
|------------------|--------|-------|
| Nhân viên SSO vào nhiều account hoặc SaaS | **Identity Center** | Permission set + credential tạm qua STS |
| Tài khoản AD on-prem đăng nhập Console đa account | **Identity Center + AD Connector hoặc Managed AD** | AD làm identity source |
| Công ty đã dùng Okta hoặc Azure AD | **Identity Center + External IdP** (SAML 2.0) | Không cần Directory Service |
| Chưa có hệ thống danh tính nào | **Identity Center store** | Thư mục tích hợp sẵn |
| AD đầy đủ trên AWS, schema thật, trust | **AWS Managed Microsoft AD** | AD thật do AWS quản lý |
| Có AD on-prem, không nhân bản danh tính | **AD Connector** | Proxy, không lưu trên AWS |
| Ít user, AD cơ bản, chi phí thấp | **Simple AD** | Nhẹ, rẻ |

Khi đề ghép AD với Identity Center, đáp án là **Managed Microsoft AD hoặc AD Connector**, vì **Simple AD không dùng được làm identity source** của Identity Center.

> **Pattern đề thi:** *Nhân viên dùng tài khoản AD on-prem để đăng nhập AWS Console ở nhiều account mà không đồng bộ danh tính lên cloud* => **IAM Identity Center với AD Connector làm identity source**.

## 5. Kịch bản thi

1. Consultant cần quyền vào account trong 30 ngày. => Permission set, gỡ assignment sau 30 ngày, không cấp IAM User access key.
2. Công ty nhỏ, ít user, cần AD cơ bản với chi phí thấp. => Simple AD.
3. WorkSpaces cần xác thực bằng AD on-prem sẵn có mà không nhân bản danh tính. => AD Connector.
4. Người dùng on-prem và AWS dùng một danh tính, mỗi bên giữ directory riêng. => Managed Microsoft AD kèm trust với AD on-prem.
5. Instance EC2 Windows cần join domain. => Directory Service, phổ biến là Managed Microsoft AD.
6. App mobile cho khách hàng đăng ký và đăng nhập. => Amazon Cognito, không phải Identity Center.
7. Cần audit nhân viên nào đã vào account nào. => CloudTrail ghi các sự kiện AssumeRole của STS.

## 6. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| SSO tập trung cho nhân viên, nhiều account | **IAM Identity Center** | IAM User ở từng account |
| Dev vào staging, admin vào prod | **Permission set khác nhau** gán theo group | Một AdministratorAccess cho tất cả |
| Có permission set Administrator vẫn bị chặn | **SCP** Deny vẫn thắng | Nghĩ permission set vượt được SCP |
| AD on-prem làm nguồn đăng nhập Console | **Identity Center + Directory Service** | Cognito User Pool |
| Người dùng cuối đăng nhập app web/mobile | **Cognito User Pool** | Identity Center, Directory Service |
| App mobile cần credential tạm để upload S3 | **Cognito Identity Pool** + STS | Identity Center |
| EC2 truy cập DynamoDB | **IAM Role** | SSO |
| Ứng dụng cần schema AD thật (SharePoint, SQL Server, .NET) | **Managed Microsoft AD** | Simple AD |
| RDS SQL Server Windows Authentication | **Managed Microsoft AD** | AD Connector |
| Đã có AD on-prem, không muốn nhân bản | **AD Connector** | Managed AD rồi đồng bộ user lên cloud |
| Quản trị viên cần quyền vận hành tài nguyên AWS | **IAM** | Directory Service |
| Chọn directory làm identity source cho Identity Center | **Managed Microsoft AD** hoặc **AD Connector** | Simple AD |

## 7. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Identity Center vs IAM User:** IAM User mang credential dài hạn và chỉ sống trong một account, còn Identity Center cho nhân viên SSO qua nhiều account với credential tạm thời qua STS.
- **Permission set vs IAM Group:** permission set gắn quyền khi người dùng vào một account qua SSO, còn IAM Group gắn policy cho IAM User bên trong chính account đó.
- **Identity Center vs Cognito:** Identity Center dành cho workforce (admin, dev, ops), còn Cognito dành cho khách hàng là người dùng cuối của ứng dụng bạn xây dựng.
- **Identity Center vs STS:** STS là cơ chế cấp credential tạm thời ở tầng thấp, còn Identity Center là giải pháp quản lý SSO đa account ở tầng cao và dùng STS phía sau.
- **Directory Service vs IAM:** Directory Service lo danh tính kiểu AD cho người dùng, máy doanh nghiệp và ứng dụng phụ thuộc AD, còn IAM lo quyền vận hành tài nguyên AWS.
- **Directory Service vs Cognito:** Directory Service dành cho nhân viên và máy doanh nghiệp, còn Cognito dành cho người dùng cuối. Đừng dùng AD cho khách hàng của app, và đừng dùng Cognito để domain join.
- **AD Connector vs trust relationship:** AD Connector không lưu danh tính trên AWS mà chỉ chuyển tiếp, còn trust relationship có AD thật trên AWS liên thông với on-prem. Connector nhẹ hơn, trust đầy đủ hơn.

## 8. Câu nhớ nhanh trước khi thi

> **Workforce SSO đa account => IAM Identity Center. Khách hàng đăng nhập app => Cognito. Máy và workload => IAM Role.**
>
> **Permission set = IAM policy gán qua SSO. Đăng nhập => credential tạm qua STS => audit bằng CloudTrail.**
>
> **SCP vẫn giới hạn quyền dù người dùng có permission set Administrator.**
>
> **Cần Active Directory => Directory Service. Managed Microsoft AD = AD thật, trust, schema thật, RDS SQL Server Windows Authentication.**
>
> **AD Connector = proxy về AD on-prem, không lưu danh tính. Simple AD = AD nhẹ và rẻ cho nhu cầu cơ bản.**
>
> **AD on-prem + Console đa account => Identity Center + Directory Service. AD là kho danh tính, Identity Center là cổng SSO.**

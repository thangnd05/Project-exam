# SAA-C03: Tài liệu cho các tag đã gộp

> Bộ tài liệu thay thế cho các tag SAA-C03 vừa được gộp, **đọc độc lập** và viết theo cùng quy ước với bộ dop02. Mỗi tag giải thích từ đầu: vấn đề thực tế, cách từng dịch vụ trong nhóm chạy, cách phân biệt các dịch vụ trong nhóm với nhau, kịch bản thi, bẫy, câu nhớ nhanh. Trọng tâm của tag gộp là **chọn đúng dịch vụ trong nhóm**, vì câu hỏi của các tag này thường đặt các dịch vụ đó làm đáp án nhiễu của nhau.

Ngày 2026-09-30, bộ SAA-C03 gộp từ **72 tags** còn **51 tags**. Thư mục này chứa **15 tài liệu**: 14 tài liệu cho 14 tag gộp, và 1 tài liệu mới cho tag `EC2-Instance-Selection` (tên cũ là `Managed-Compute` của High-Performing, đổi tên vì câu hỏi của tag này hỏi về chọn và bố trí EC2, không phải compute được quản lý). Các tag còn lại giữ nguyên tài liệu cũ trong `D:\WINDE-AWS-DATA\document\c03`.

Số thư mục **trùng số domain exam**, giống bộ c03 cũ:

| Thư mục trong bộ này | Tên domain | Số domain exam | Tỷ lệ điểm | Tag gộp |
|----------------------|------------|----------------|------------|---------|
| [1-Secure Architectures](./1-Secure%20Architectures/) | Design Secure Architectures | Domain 1 | 30% | 4 |
| [2-Resilient Architectures](./2-Resilient%20Architectures/) | Design Resilient Architectures | Domain 2 | 26% | 3 |
| [3-High-Performing Architectures](./3-High-Performing%20Architectures/) | Design High-Performing Architectures | Domain 3 | 24% | 3 + 1 tag đổi tên |
| [4-Cost-Optimized Architectures](./4-Cost-Optimized%20Architectures/) | Design Cost-Optimized Architectures | Domain 4 | 20% | 4 |

## Bản đồ tag gộp

### 1. Secure Architectures (4)

| Tag | File | Thay cho tài liệu cũ |
|-----|------|----------------------|
| IAM / AWS-STS (Identity and Access Management / Security Token Service) | [IAM-STS.md](./1-Secure%20Architectures/IAM-STS.md) | IAM, AWS-STS |
| IAM-Identity-Center / AWS-Directory-Service (Federation and SSO) | [IAM-Identity-Center-Directory-Service.md](./1-Secure%20Architectures/IAM-Identity-Center-Directory-Service.md) | IAM-Identity-Center, AWS-Directory-Service |
| AWS-KMS / ACM (Encryption Keys and Certificates) | [AWS-KMS-ACM.md](./1-Secure%20Architectures/AWS-KMS-ACM.md) | AWS-KMS, ACM |
| Threat-Detection (GuardDuty / Inspector / Macie / Security Hub) | [Threat-Detection.md](./1-Secure%20Architectures/Threat-Detection.md) | AWS-GuardDuty, AWS-Inspector, Amazon-Macie, AWS-Security-Hub |

### 2. Resilient Architectures (3)

| Tag | File | Thay cho tài liệu cũ |
|-----|------|----------------------|
| ELB (Application / Network Load Balancer) | [ELB-ALB-NLB.md](./2-Resilient%20Architectures/ELB-ALB-NLB.md) | ALB, NLB |
| Amazon-EFS / Amazon-FSx (Shared File Storage) | [Amazon-EFS-FSx.md](./2-Resilient%20Architectures/Amazon-EFS-FSx.md) | Amazon-EFS, Amazon-FSx |
| AWS-Direct-Connect / AWS-Transit-Gateway (Hybrid and Multi-VPC Networking) | [AWS-Direct-Connect-Transit-Gateway.md](./2-Resilient%20Architectures/AWS-Direct-Connect-Transit-Gateway.md) | AWS-Direct-Connect, AWS-Transit-Gateway |

### 3. High-Performing Architectures (3 + 1)

| Tag | File | Thay cho tài liệu cũ |
|-----|------|----------------------|
| EC2-Instance-Selection (Instance Families / Graviton / Placement Groups / Accelerators) | [EC2-Instance-Selection.md](./3-High-Performing%20Architectures/EC2-Instance-Selection.md) | Không thay file nào. Tài liệu mới; `Managed-Compute.md` vẫn giữ cho tag `Managed-Compute (ECS / EKS / Fargate)` của Resilient |
| Amazon-Kinesis / Amazon-Data-Firehose (Streaming) | [Amazon-Kinesis-Data-Firehose.md](./3-High-Performing%20Architectures/Amazon-Kinesis-Data-Firehose.md) | Amazon-Kinesis, Amazon-Kinesis / Amazon-Data-Firehose |
| AWS-Glue / Amazon-Athena (Analytics) | [AWS-Glue-Amazon-Athena.md](./3-High-Performing%20Architectures/AWS-Glue-Amazon-Athena.md) | AWS-Glue, Amazon-Athena |
| AI-ML-Services (Rekognition / Comprehend Medical) | [AI-ML-Services.md](./3-High-Performing%20Architectures/AI-ML-Services.md) | Amazon-Rekognition, Amazon-Comprehend-Medical |

### 4. Cost-Optimized Architectures (4)

| Tag | File | Thay cho tài liệu cũ |
|-----|------|----------------------|
| S3-Storage-Classes-and-Lifecycle (Intelligent-Tiering / Glacier) | [S3-Storage-Classes-and-Lifecycle.md](./4-Cost-Optimized%20Architectures/S3-Storage-Classes-and-Lifecycle.md) | Amazon S3, S3-Lifecycle-Policy, S3-Intelligent-Tiering, S3-Glacier |
| EC2-Purchasing-Options (Reserved / Savings Plans / Spot / Capacity Reservation) | [EC2-Purchasing-Options.md](./4-Cost-Optimized%20Architectures/EC2-Purchasing-Options.md) | Reserved-Instances, EC2-Spot-Instances, On-Demand Capacity Reservations (ODCR) |
| Cost-Visibility-and-Governance (Cost Explorer / Budgets / Allocation Tags / FinOps) | [Cost-Visibility-and-Governance.md](./4-Cost-Optimized%20Architectures/Cost-Visibility-and-Governance.md) | AWS-Cost-Explorer, AWS-Budgets, Cost-Allocation-Tags, FinOps-Strategy |
| Network-Costs (Data Transfer / VPC Endpoint) | [Network-Costs.md](./4-Cost-Optimized%20Architectures/Network-Costs.md) | Data-Transfer-Costs, VPC-Endpoint |

## Cách thay vào bộ tài liệu cũ

1. Chép từng file vào đúng thư mục domain trong `D:\WINDE-AWS-DATA\document\c03`, rồi xóa các file ở cột **Thay cho tài liệu cũ**. Riêng `Amazon S3.md` (Resilient) và `VPC-Endpoint.md` (Secure) phải **giữ lại**, vì tag `Amazon-S3 (Simple Storage Service)` và tag `VPC-Endpoint (Virtual Private Cloud Endpoint)` vẫn dùng chúng.
2. Trên web, upload tài liệu mới vào tag gộp, rồi gỡ các tài liệu cũ khỏi tag đó. Hiện mỗi tag gộp đang gắn nhiều tài liệu cũ, vì tài liệu của các tag bị gộp đã được chuyển sang. Chỉ gỡ khỏi tag gộp, đừng xóa hẳn tài liệu `Amazon S3` và `VPC-Endpoint`: `Amazon S3` còn gắn với tag S3 của Resilient và High-Performing, `VPC-Endpoint` còn gắn với tag VPC-Endpoint của Secure.
3. Tài liệu "Amazon-Kinesis" cũ trên web có một bản đang lỗi 404 (Cloudinary `file_ck0bxj`). Gỡ bản đó khi upload tài liệu mới.

## Cách dùng bộ này

Mỗi tag là **bài học độc lập** (khoảng 80 đến 140 dòng): tổng quan kèm bảng khối kiến thức, từng dịch vụ trong nhóm, các callout Pattern đề thi sau từng mục, kịch bản thi, bảng bẫy hay gặp, mục phân biệt dịch vụ dễ nhầm, và câu nhớ nhanh trước khi thi.

1. Lần đầu: đọc **cả bài** từ mục 1. Đừng nhảy thẳng tới Câu nhớ nhanh.
2. Trước khi làm đề: ôn các callout **Pattern đề thi**, bảng **Tổng hợp các bẫy hay gặp trong đề**, và mục **Câu nhớ nhanh trước khi thi**.
3. Với tag gộp, câu hỏi thường đặt các dịch vụ **cùng nhóm** làm đáp án nhiễu của nhau. Ôn kỹ callout **Một câu định vị** ở mục 1.
4. Cross-reference chỉ trỏ tag **trong bộ SAA-C03**, dùng tên tag sau khi gộp.

> **Nguyên tắc SAA-C03:** nhiều đáp án đúng kỹ thuật thì chọn cái **đáp ứng đủ yêu cầu** (bảo mật, sẵn sàng, hiệu năng, chi phí) với **ít công vận hành nhất** (least operational overhead) và **dùng dịch vụ managed**.

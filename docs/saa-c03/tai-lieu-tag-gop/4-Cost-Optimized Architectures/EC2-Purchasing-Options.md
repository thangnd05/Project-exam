# Lựa chọn mua EC2: Reserved, Savings Plans, Spot và Capacity Reservation

> **Domain:** Cost-Optimized Architectures (exam Domain 4). Tag: EC2-Purchasing-Options (Reserved / Savings Plans / Spot / Capacity Reservation). Chọn đúng cách trả tiền cho compute theo độ ổn định của tải, khả năng chịu ngắt và nhu cầu giữ chỗ phần cứng.
> **Mức độ ra đề:** Cực kỳ cao. Câu hỏi thường đặt On-Demand, Reserved Instances, Savings Plans, Spot và Capacity Reservation làm đáp án nhiễu của nhau. Bẫy chính là nhầm giữa giảm giá và giữ chỗ, và quên rằng Savings Plans không phủ RDS.
> **Cross-reference:** Cost-Visibility-and-Governance, AWS-Compute-Optimizer, AWS-Auto-Scaling, Managed-Compute, ELB-ALB-NLB.

## 1. Tổng quan: các lựa chọn mua EC2 giải quyết vấn đề gì

Một hệ thống ERP chạy 24/7 suốt ba năm mà trả giá On-Demand là ném tiền qua cửa sổ. Một cụm render video chạy ban đêm cần hàng trăm máy nhưng ngân sách rất hẹp. Một đợt Black Friday cần chắc chắn scale được 50 máy tại đúng một AZ, trong khi AWS có thể trả lỗi `InsufficientInstanceCapacity` khi instance type đó khan hiếm. Ba vấn đề này cần ba công cụ khác nhau: **cam kết dài hạn để giảm giá**, **dùng capacity dư thừa giá rẻ chấp nhận bị thu hồi**, và **giữ chỗ phần cứng**.

Năm khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **On-Demand** | Trả theo giây hoặc giờ, không cam kết | Tải ngắn hạn, đột biến, chưa rõ nhu cầu, dev/test ban đầu |
| **Reserved Instances (RI)** | Cam kết một cấu hình cụ thể trong 1 hoặc 3 năm | Giảm giá cho tải ổn định; Zonal RI còn giữ chỗ tại một AZ |
| **Savings Plans** | Cam kết **số tiền mỗi giờ** (ví dụ $10/giờ) trong 1 hoặc 3 năm | Giảm giá linh hoạt hơn RI, tự áp cho EC2, Fargate, Lambda |
| **Spot Instances** | Capacity dư thừa của AWS, giảm tới 90%, bị thu hồi với cảnh báo 2 phút | Tải chịu lỗi, stateless, batch |
| **On-Demand Capacity Reservation (ODCR)** | Giữ chỗ phần cứng tại một AZ, trả giá On-Demand | Bảo đảm capacity mà không cam kết dài hạn |

> **Một câu định vị:** tải ổn định 24/7 và muốn rẻ nhất => **Standard RI hoặc EC2 Instance Savings Plan**. Ổn định nhưng có thể đổi dòng máy, hoặc trải trên EC2, Fargate, Lambda => **Compute Savings Plan** (hoặc Convertible RI). Chịu lỗi, chấp nhận bị ngắt => **Spot**. Cần chắc chắn có máy tại một AZ, ngắn hạn => **ODCR**. Vừa giữ chỗ vừa giảm giá dài hạn => **Zonal RI**. Cần giảm giá cho RDS, ElastiCache, Redshift, OpenSearch => **Reserved Instances** của dịch vụ đó. Cần license theo socket hoặc core => **Dedicated Host**.

## 2. Bảng so sánh các lựa chọn mua

| Lựa chọn | Giảm giá so với On-Demand | Cam kết | Giữ chỗ capacity | Bị ngắt | Linh hoạt |
|----------|---------------------------|---------|------------------|---------|-----------|
| **On-Demand** | 0% | Không | Không | Không | Tối đa |
| **Standard RI** | Tới **72%** (sâu nhất) | 1 hoặc 3 năm | Chỉ khi chọn **Zonal** | Không | Không đổi family, OS, tenancy; bán lại được trên RI Marketplace |
| **Convertible RI** | Ít hơn Standard RI | 1 hoặc 3 năm | Chỉ khi chọn Zonal | Không | **Đổi** family, OS, tenancy, scope nếu gói mới có giá trị bằng hoặc lớn hơn |
| **Compute Savings Plan** | Tới **66%** | $/giờ, 1 hoặc 3 năm | **Không** | Không | Mọi family, size, AZ, Region, OS, tenancy; phủ cả **Fargate và Lambda** |
| **EC2 Instance Savings Plan** | Tới **72%** | $/giờ, 1 hoặc 3 năm | **Không** | Không | Cố định một instance family trong một Region, đổi size, OS, tenancy được |
| **Spot** | Tới **90%** | Không | Không | **Có**, báo trước 2 phút | Chỉ hợp tải chịu lỗi |
| **ODCR** | **0%** (tự nó không giảm) | Không, hủy bất kỳ lúc nào | **Có**, một AZ, một instance type | Không | Trả tiền cả khi không chạy máy |
| **Dedicated Host / Dedicated Instance** | Host có thể mua kèm reservation | Tùy chọn | Host: cả máy chủ vật lý riêng | Không | Host thấy socket và core, dùng cho license BYOL; Instance chỉ bảo đảm phần cứng không chia với account khác |

RI và Savings Plans đều có ba cách trả: **All Upfront** (rẻ nhất), **Partial Upfront** và **No Upfront**, và kỳ hạn 3 năm giảm nhiều hơn 1 năm. Cây quyết định khi đọc đề:

```text
Chịu lỗi, bị ngắt không sao => Spot | Ngắn hạn, đột biến, chưa rõ nhu cầu => On-Demand
Ổn định dài hạn: RDS/ElastiCache/Redshift/OpenSearch => RI của dịch vụ đó
  Một cấu hình cố định, rẻ nhất => Standard RI hoặc EC2 Instance Savings Plan
  Có thể đổi family/Region, hoặc có Fargate, Lambda => Compute Savings Plan (hoặc Convertible RI)
Cần chắc chắn có capacity tại một AZ: dài hạn => Zonal RI | ngắn hạn => ODCR | GPU cho ML => Capacity Blocks
```

> **Pattern đề thi:** *Hệ thống chạy ổn định 24/7 trong ba năm, cấu hình không đổi, sẵn sàng trả trước để có giá thấp nhất* => **Standard Reserved Instances 3 năm, All Upfront**.

## 3. Reserved Instances

RI không phải một máy ảo mới mà là **cơ chế tính giá**: bạn cam kết một cấu hình trong 1 hoặc 3 năm để được giảm tới 72%. **Standard RI** giảm sâu nhất nhưng không đổi được instance family, OS hay tenancy; nếu không dùng nữa thì lối thoát là bán lại trên **EC2 Reserved Instance Marketplace**. **Convertible RI** giảm ít hơn nhưng cho phép **exchange** sang cấu hình khác bất kỳ lúc nào, miễn là gói mới có giá trị bằng hoặc lớn hơn gói cũ.

Phạm vi của RI quyết định việc giữ chỗ. **Zonal RI** gắn vào một AZ cụ thể và **giữ chỗ capacity** tại đó, tránh lỗi `InsufficientInstanceCapacity`. **Regional RI** không giữ chỗ nhưng áp giảm giá cho mọi AZ trong Region và có **Instance Size Flexibility** trong cùng family (với Linux), ví dụ từ `t3.medium` lên `t3.large`. Trong AWS Organizations, phần giảm giá của RI mua dư ở account A được **chia sẻ** sang máy On-Demand của account B trong cùng tổ chức, và có thể tắt tính năng chia sẻ này ở management account.

RI là lựa chọn bắt buộc khi cần giảm giá cho **Amazon RDS, ElastiCache, Redshift, OpenSearch**, vì Compute Savings Plans và EC2 Instance Savings Plans không phủ các dịch vụ này. Để phát hiện RI mua xong bị bỏ phí, dùng **AWS Budgets** loại RI Utilization, chi tiết ở tag Cost-Visibility-and-Governance.

> **Pattern đề thi:** *Cơ sở dữ liệu RDS production chạy 24/7 nhiều năm, cần giảm chi phí* => **RDS Reserved Instances** (Compute Savings Plan không phủ RDS).

## 4. Savings Plans

Savings Plans thay đổi đơn vị cam kết: thay vì cam kết một số máy cụ thể, bạn cam kết **số tiền tiêu mỗi giờ** trong 1 hoặc 3 năm, phần dùng vượt cam kết tính giá On-Demand. **Compute Savings Plan** giảm tới 66% và tự áp cho EC2 bất kể family, size, AZ, Region, OS hay tenancy, và phủ cả **Fargate** lẫn **Lambda**, nên không cần exchange thủ công như Convertible RI. **EC2 Instance Savings Plan** giảm tới 72% nhưng cố định một instance family trong một Region.

Savings Plans **không giữ chỗ capacity**. Muốn vừa giảm giá linh hoạt vừa chắc chắn có máy thì ghép Savings Plan với ODCR. Cost Explorer đưa ra khuyến nghị nên cam kết bao nhiêu tiền mỗi giờ dựa trên 7, 30 hoặc 60 ngày sử dụng gần nhất, và nên right-size bằng Compute Optimizer trước khi cam kết.

> **Pattern đề thi:** *Công ty chạy EC2, Fargate và Lambda ổn định, lộ trình có thể đổi dòng máy và Region, muốn giảm chi phí với ít công quản lý nhất* => **Compute Savings Plan**.

## 5. Spot Instances

Spot là capacity dư thừa được bán rẻ tới 90%, giá biến động chậm theo cung cầu dài hạn, không còn đấu giá từng phút. Giá tối đa mặc định bằng giá On-Demand và bạn luôn trả theo giá Spot thực tế. AWS phát hai tín hiệu trước khi thu hồi. **Rebalance Recommendation** đến sớm nhất, báo pool sắp cạn, và bật **Capacity Rebalancing** trong Auto Scaling Group để khởi chạy máy thay thế trước khi máy cũ bị lấy lại. **Spot Instance Interruption Notice** là cảnh báo chắc chắn **2 phút**, đọc qua Instance Metadata hoặc EventBridge để dọn dẹp; khi đứng sau ALB thì đặt **Deregistration Delay nhỏ hơn 120 giây** để kịp rút các request đang xử lý. Hành vi khi bị ngắt có ba lựa chọn: **Terminate** (mặc định), **Stop** và **Hibernate**. Hibernate lưu RAM xuống ổ root, đòi hỏi ổ root là **EBS** (không phải Instance Store), đủ dung lượng chứa RAM, và chỉ hỗ trợ một số OS và instance family. Khi bị terminate, các ổ EBS phụ bị xóa hay không phụ thuộc cờ `DeleteOnTermination`. Về tiền, đáp án kinh điển là AWS ngắt thì không tính phần giờ dở dang còn bạn tự dừng thì trả đủ; với OS tính tiền theo giây thì trả theo số giây đã chạy.

| Chiến lược phân bổ trong ASG | Cơ chế | Dùng khi |
|------------------------------|--------|----------|
| **price-capacity-optimized** | Cân bằng giá rẻ và pool nhiều capacity | Khuyến nghị mặc định cho hầu hết tải |
| **capacity-optimized** | Chọn pool dư capacity nhiều nhất | Giảm tỷ lệ bị ngắt xuống thấp nhất |
| **capacity-optimized-prioritized** | Như trên nhưng tôn trọng thứ tự ưu tiên instance type | Ứng dụng chạy tốt nhất trên vài dòng máy |
| **lowest-price** | Chọn các pool rẻ nhất | Rẻ tuyệt đối, chấp nhận bị ngắt nhiều, chỉ cho lab hoặc test |

Spot hợp với batch, CI/CD, big data, render, và worker node của container. **Auto Scaling Group với Launch Template** trộn On-Demand làm nền và Spot để tiết kiệm. **AWS Batch** chọn compute environment kiểu SPOT. Với **EMR**, chạy **Task Node** bằng Spot vì chúng không giữ dữ liệu HDFS, còn master và core node thì không. Với **EKS**, Spot dùng cho worker node, không bao giờ cho control plane.

> **Pattern đề thi:** *Hàng nghìn job xử lý ảnh chạy lại được nếu lỗi, cần chi phí thấp nhất* => **Spot Instances** (qua AWS Batch hoặc Auto Scaling Group).

## 6. On-Demand Capacity Reservation

ODCR giữ chỗ một số lượng instance cụ thể (ví dụ 10 máy `m5.xlarge`) tại **một AZ** với platform và tenancy xác định. Bạn trả **giá On-Demand cho toàn bộ số chỗ đã giữ**, kể cả khi chưa chạy máy nào hoặc máy đang stop, và có thể hủy bất kỳ lúc nào. ODCR tự nó **không giảm giá**, nhưng nếu đã có Regional RI hoặc Savings Plans khớp cấu hình thì phần giảm giá tự áp lên chỗ đã giữ. Tiêu chí khớp **open** cho mọi instance cùng cấu hình dùng chỗ, còn **targeted** chỉ cho instance chỉ định `CapacityReservationId`. Auto Scaling Group dùng Launch Template trỏ tới reservation để scale-out chắc chắn thành công. Ngữ cảnh ra đề gồm sự kiện ngắn hạn như Black Friday, instance type khan hiếm như GPU hay bare metal, và bước giữ chỗ trung gian trước khi mua RI. Với GPU cho ML trong một khoảng thời gian định trước, AWS có **Capacity Blocks for ML**.

> **Pattern đề thi:** *Auto Scaling Group scale-out bị lỗi hết capacity tại một AZ trong giờ cao điểm, sự kiện chỉ kéo dài vài ngày* => **ODCR kèm Launch Template trỏ tới reservation**.

## 7. So sánh và chọn trong nhóm

Cặp dễ nhầm nhất là **giảm giá** và **giữ chỗ**. Regional RI và Savings Plans chỉ giảm giá. ODCR chỉ giữ chỗ và trả giá đầy đủ. Zonal RI làm cả hai nhưng phải cam kết 1 hoặc 3 năm. Vì vậy tải ổn định nhiều năm cần chắc chắn có máy thì Zonal RI rẻ hơn ODCR thuần, còn nhu cầu giữ chỗ vài ngày thì ODCR đúng hơn vì không cam kết. Giữa RI và Savings Plans, Savings Plans linh hoạt hơn và phủ Fargate, Lambda, còn RI là lựa chọn duy nhất cho RDS, ElastiCache, Redshift, OpenSearch và cho nhu cầu giữ chỗ kèm giảm giá. Kiến trúc tối ưu thường là tổ hợp: **Savings Plan hoặc RI cho phần nền**, **On-Demand cho phần tăng đột biến**, **Spot cho phần chịu lỗi**. Dedicated Host là cả máy chủ vật lý riêng, thấy được socket và core, dùng khi license phần mềm tính theo socket hoặc core; Dedicated Instance chỉ bảo đảm phần cứng không chia với account khác.

> **Pattern đề thi:** *Web app có tải nền ổn định cộng các đợt tăng đột biến không đoán trước, và một lớp xử lý nền chạy lại được* => **Savings Plan cho phần nền, On-Demand cho đột biến, Spot cho xử lý nền**.

## 8. Kịch bản thi

1. Chạy EC2 m5.xlarge chắc chắn 3 năm, muốn rẻ nhất. => Standard RI 3 năm All Upfront.
2. Có thể đổi instance family sau một năm. => Convertible RI hoặc Compute Savings Plan.
3. EC2, Fargate và Lambda chạy ổn định, muốn một cam kết chung. => Compute Savings Plan.
4. Cần giữ chỗ tại một AZ cho Black Friday vài ngày. => ODCR (dài hạn thì Zonal RI).
5. Batch job chịu lỗi, chi phí thấp nhất. => Spot Instances.
6. Muốn Auto Scaling Group tự thay máy Spot trước khi bị thu hồi. => Capacity Rebalancing.
7. Cần giữ trạng thái RAM khi Spot bị thu hồi. => Interruption behavior là Hibernate, ổ root EBS đủ dung lượng.
8. Cụm EMR cần giảm chi phí mà không mất dữ liệu HDFS. => Task Node chạy Spot.

## 9. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Giảm giá dài hạn cho RDS, ElastiCache, Redshift | Reserved Instances của dịch vụ đó | Compute Savings Plan |
| Cần chắc chắn có capacity tại một AZ | Zonal RI hoặc ODCR | Regional RI hoặc Savings Plans (không giữ chỗ) |
| Đã giữ chỗ bằng ODCR nhưng chưa chạy máy | Vẫn trả giá On-Demand cho toàn bộ chỗ | Nghĩ không chạy thì không mất tiền |
| Tải ổn định nhiều năm cần giữ chỗ | Zonal RI | ODCR thuần (quá đắt cho dài hạn) |
| RI Standard mua xong không dùng | Bán lại trên RI Marketplace | Exchange (chỉ Convertible được exchange) |
| Rút request êm khỏi ALB trước khi Spot bị thu hồi | Deregistration Delay dưới 120 giây, bắt Interruption Notice | Đặt delay 300 giây mặc định |
| Hibernate Spot không chạy | Ổ root phải là EBS và đủ chỗ chứa RAM | Dùng Instance Store |
| Spot cho control plane EKS hoặc master node EMR | Không dùng Spot, chỉ worker hoặc Task Node | Chạy toàn bộ cụm bằng Spot |

## 10. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Reserved Instances vs Savings Plans:** RI cam kết một cấu hình cụ thể và là lựa chọn cho RDS, ElastiCache, Redshift, OpenSearch. Savings Plans cam kết số tiền mỗi giờ, tự áp cho EC2, Fargate, Lambda và không cần exchange thủ công.
- **Standard RI vs Convertible RI:** Standard giảm sâu nhất nhưng không đổi family, OS, tenancy và chỉ thoát bằng cách bán trên Marketplace. Convertible giảm ít hơn nhưng exchange được sang gói có giá trị bằng hoặc lớn hơn.
- **Zonal RI vs Regional RI:** Zonal giữ chỗ tại một AZ. Regional không giữ chỗ nhưng linh hoạt AZ và có Instance Size Flexibility.
- **ODCR vs Zonal RI:** ODCR chỉ giữ chỗ, trả giá On-Demand, hủy lúc nào cũng được. Zonal RI vừa giữ chỗ vừa giảm giá nhưng cam kết 1 hoặc 3 năm.
- **ODCR vs Capacity Blocks for ML:** ODCR giữ chỗ instance thông thường không thời hạn tối thiểu. Capacity Blocks đặt trước GPU cho ML trong một khoảng thời gian định trước.
- **Rebalance Recommendation vs Interruption Notice:** Rebalance Recommendation đến sớm, không có mốc cố định, dùng để chủ động thay máy. Interruption Notice là cảnh báo chắc chắn 2 phút, dùng để dọn dẹp.

## 11. Câu nhớ nhanh trước khi thi

> **Ổn định 24/7 và muốn rẻ nhất => Standard RI 3 năm All Upfront hoặc EC2 Instance Savings Plan. Sợ đổi dòng máy => Compute Savings Plan hoặc Convertible RI.**
>
> **RDS, ElastiCache, Redshift, OpenSearch => bắt buộc Reserved Instances, né Savings Plans.**
>
> **Giữ chỗ không giảm giá => ODCR. Giữ chỗ và giảm giá => Zonal RI. Regional RI và Savings Plans không giữ chỗ.**
>
> **Spot giảm tới 90%, chỉ cho tải chịu lỗi. Rebalance Recommendation báo sớm, Interruption Notice báo chắc chắn 2 phút. Spot trong Auto Scaling Group => price-capacity-optimized và Capacity Rebalancing. Sau ALB => Deregistration Delay dưới 120 giây.**
>
> **Nền dùng Savings Plan hoặc RI, đột biến dùng On-Demand, chịu lỗi dùng Spot.**

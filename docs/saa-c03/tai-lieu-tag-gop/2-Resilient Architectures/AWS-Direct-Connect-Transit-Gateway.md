# AWS Direct Connect và AWS Transit Gateway

> **Domain:** Resilient Architectures (exam Domain 2). Tag: AWS-Direct-Connect / AWS-Transit-Gateway (Hybrid and Multi-VPC Networking). Direct Connect là đường truyền vật lý riêng từ on-premise vào AWS, Transit Gateway là router trung tâm nối nhiều VPC, VPN và Direct Connect; hai dịch vụ thường dùng cùng nhau qua Transit VIF.
> **Mức độ ra đề:** Cao. Direct Connect là đáp án kinh điển cho kết nối on-premise ổn định, băng thông cao, độ trễ thấp, với bẫy lớn nhất là phân biệt với VPN và hiểu Direct Connect không tự có HA. Transit Gateway ra mức trung bình với keyword hub-and-spoke, nhiều VPC, central routing.
> **Cross-reference:** VPC-Endpoint, VPC-Traffic-Control, Network-Costs, ELB-ALB-NLB, Amazon-EFS-FSx, AWS-DR-Strategies.

## 1. Tổng quan: Direct Connect và Transit Gateway giải quyết vấn đề gì

Một doanh nghiệp có data center on-premise và hai mươi VPC trên AWS thuộc nhiều account. Kết nối qua Internet công cộng có băng thông và độ trễ dao động theo tải mạng chung, không đủ cho workload nhạy hiệu năng. Nếu nối các VPC bằng VPC Peering thì số kết nối tăng theo cấp số nhân: mesh đầy đủ cần n(n-1)/2 kết nối, mười VPC đã là 45 peering.

Bài toán tách làm hai phần: **đường truyền vào AWS** (Direct Connect hoặc VPN) và **cách phân phối kết nối tới nhiều VPC** (Transit Gateway hoặc VPC Peering).

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **AWS Direct Connect (DX)** | Đường truyền riêng chuyên dụng từ on-premise tới AWS, không qua Internet | Băng thông cam kết (tới 100 Gbps), độ trễ thấp và nhất quán |
| **Virtual Interface (VIF)** | Private, Public, Transit VIF trên đường DX | Quyết định DX đi tới VPC, dịch vụ AWS public hay Transit Gateway |
| **Site-to-Site VPN** | Kết nối IPsec mã hóa qua Internet | Dựng trong vài phút, rẻ, làm dự phòng hoặc mã hóa trên DX |
| **AWS Transit Gateway (TGW)** | Router trung tâm theo mô hình hub-and-spoke | Nối nhiều VPC, VPN, DX với routing tập trung và có tính bắc cầu |

> **Một câu định vị:** cần đường on-premise ổn định, băng thông lớn => **Direct Connect**. Cần nhanh, rẻ, mã hóa sẵn qua Internet => **Site-to-Site VPN**. Cần nối nhiều VPC và on-premise qua một điểm trung tâm => **Transit Gateway**. Chỉ hai VPC => VPC Peering. VPC gọi S3 hay DynamoDB riêng tư => VPC Endpoint, không phải Transit Gateway.

## 2. AWS Direct Connect

Direct Connect riêng tư nhờ **tách biệt vật lý**, không nhờ mã hóa, nên **mặc định không mã hóa**. Triển khai mất **hàng tuần tới hàng tháng** vì phải kéo cáp. **Dedicated Connection** là một cổng vật lý nguyên 1, 10 hoặc 100 Gbps cấp riêng qua AWS, còn **Hosted Connection** đi qua đối tác Direct Connect, chia nhỏ băng thông từ 50 Mbps trở lên khi không cần nguyên cổng.

### 2.1. Ba loại Virtual Interface

**Private VIF** đi vào tài nguyên trong VPC bằng IP private, gắn vào Virtual Private Gateway của một VPC. **Public VIF** đi tới dịch vụ AWS public như S3 và DynamoDB bằng IP public nhưng vẫn **trên đường DX, không qua Internet**. **Transit VIF** đi tới **Transit Gateway** để một đường DX phục vụ nhiều VPC. Transit VIF luôn gắn qua **Direct Connect Gateway**, thành phần global cho phép một đường DX tới VPC ở nhiều region; Private VIF có thể gắn thẳng Virtual Private Gateway hoặc cũng đi qua Direct Connect Gateway.

### 2.2. High Availability và mã hóa

Một đường DX đơn là **single point of failure**. Các mức HA tăng dần theo độ bền và chi phí: một DX đơn không có HA; **DX kèm VPN dự phòng** là HA rẻ nhất, chấp nhận backup chậm hơn; **hai DX độc lập khác location hoặc thiết bị** giữ được hiệu năng cao khi failover; **DX ở hai location, mỗi location hai thiết bị** là maximum resiliency.

Nếu đề yêu cầu dữ liệu phải **mã hóa in-transit** trên DX, chạy **VPN IPsec bên trên Direct Connect** (dùng Public VIF): vừa có độ ổn định của DX vừa có mã hóa.

> **Pattern đề thi:** *Đang có một đường Direct Connect, cần dự phòng với chi phí thấp nhất, dữ liệu phải được mã hóa khi truyền* => **Site-to-Site VPN làm backup cho DX, và VPN over Direct Connect cho yêu cầu mã hóa**.

## 3. AWS Transit Gateway

Mỗi VPC nối vào Transit Gateway bằng một **TGW Attachment**; VPN và Direct Connect (qua Transit VIF) cũng gắn vào như các nhánh khác. Transit Gateway là thành phần theo region, **có tính bắc cầu (transitive routing)**: A và C nói chuyện được với nhau qua hub, điều mà VPC Peering không làm được.

**Route table trên Transit Gateway** quyết định VPC nào nói chuyện với VPC nào, dùng để **cô lập dev khỏi prod** trong cùng một hub. Transit Gateway được **chia sẻ cho nhiều account qua AWS Resource Access Manager (RAM)**, thường đặt trong account mạng dùng chung. Site-to-Site VPN có thể gắn thẳng vào Transit Gateway thay cho Virtual Private Gateway; khi đó dùng **ECMP** trên nhiều tunnel VPN để cộng dồn băng thông vượt giới hạn khoảng 1,25 Gbps của mỗi tunnel.

Transit Gateway **không thay thế VPC Endpoint**: Transit Gateway nối VPC với VPC và on-premise, còn Endpoint nối VPC với dịch vụ AWS.

> **Pattern đề thi:** *Mười lăm VPC ở nhiều account cần kết nối lẫn nhau và với on-premise, nhưng dev không được đi sang prod* => **Transit Gateway chia sẻ qua RAM, route table tách dev và prod**.

## 4. Chọn và kết hợp dịch vụ trong nhóm

| Tiêu chí | Direct Connect | Site-to-Site VPN | Transit Gateway | VPC Peering |
|----------|----------------|------------------|-----------------|-------------|
| Mục đích | Đường vật lý on-premise vào AWS | Đường mã hóa qua Internet | Hub cho nhiều VPC và hybrid | Nối trực tiếp 2 VPC |
| Đường đi | Không qua Internet | Qua Internet | Trong mạng AWS | Trong mạng AWS |
| Hiệu năng | Cam kết, ổn định | Biến động | Theo attachment | |
| Thời gian dựng | Hàng tuần tới tháng | Vài phút | Nhanh | Nhanh |
| Mã hóa mặc định | Không | Có (IPsec) | | |
| Chi phí | Cao hơn | Thấp hơn | | Rẻ, đơn giản |
| Bắc cầu | | | **Có** | **Không** |
| Keyword đề | Dedicated line, consistent | Nhanh, rẻ, mã hóa | Hub-and-spoke, nhiều VPC | 2 VPC |

Cách kết hợp chuẩn: **DX => Transit VIF => Direct Connect Gateway => Transit Gateway => mọi VPC attach**. Direct Connect là đường truyền, Transit Gateway là router logic, hai thứ bổ sung chứ không thay thế nhau. Thêm **Site-to-Site VPN gắn vào cùng Transit Gateway** làm đường dự phòng cho DX. Nếu chỉ vào **một VPC** thì Private VIF và Virtual Private Gateway là đủ; nếu chỉ cần S3 hay DynamoDB thì Public VIF, không cần VPC.

> **Pattern đề thi:** *Một đường Direct Connect phải phục vụ hai mươi VPC, cần đường dự phòng rẻ* => **Transit VIF tới Transit Gateway, VPN gắn vào Transit Gateway làm backup**.

## 5. Kịch bản thi

1. Cần băng thông cao, độ trễ ổn định giữa on-premise và AWS. => Direct Connect.
2. Cần kết nối ngay trong vài phút, chấp nhận đi qua Internet. => Site-to-Site VPN.
3. On-premise truy cập S3 qua đường DX sẵn có, không qua Internet. => Public VIF.
4. Một DX phục vụ nhiều VPC. => Transit VIF kết hợp Transit Gateway.
5. Cần HA mà vẫn giữ hiệu năng khi failover. => Hai đường DX độc lập khác location.
6. Mười lăm VPC cần nói chuyện với nhau. => Transit Gateway thay cho mesh VPC Peering.
7. Chỉ hai VPC cần nói chuyện. => VPC Peering, Transit Gateway là quá mức cần thiết.
8. EC2 ở private subnet gọi S3. => S3 Gateway Endpoint, không phải Transit Gateway.

## 6. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Kiến trúc resilient mà chỉ có một DX | **Thêm VPN backup hoặc DX thứ hai** | Cho rằng DX tự có HA |
| DX cần mã hóa in-transit | **VPN IPsec chạy trên DX** | DX trần hoặc chỉ dùng VPN |
| Dự phòng DX rẻ nhất | **Site-to-Site VPN** | Đường DX thứ hai |
| Failover vẫn giữ băng thông cao | **Hai DX độc lập** | VPN backup |
| On-premise tới S3 hoặc DynamoDB qua DX | **Public VIF** | Private VIF |
| DX vào một VPC | **Private VIF + Virtual Private Gateway** | Transit Gateway |
| DX vào nhiều VPC | **Transit VIF + Transit Gateway** | Private VIF cho từng VPC |
| VPC A peering B, B peering C, A muốn tới C | **Transit Gateway** | Tin rằng peering bắc cầu |
| Cô lập dev khỏi prod trong hub | **Route table của Transit Gateway** | Mạng phẳng một route table |
| Nhiều account dùng chung một hub | **Transit Gateway + RAM** | Peering từng cặp account |
| Tăng băng thông VPN vượt một tunnel | **VPN gắn Transit Gateway với ECMP** | VPN vào Virtual Private Gateway |
| VPC truy cập S3 riêng tư | **Gateway Endpoint** | Transit Gateway |

## 7. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Direct Connect vs Site-to-Site VPN:** Direct Connect là đường riêng vật lý, ổn định, băng thông cao, không qua Internet nhưng dựng lâu và không mã hóa sẵn. VPN đi qua Internet, có IPsec, nhanh và rẻ nhưng hiệu năng dao động. Kết hợp cả hai khi cần HA hoặc cần mã hóa trên DX.
- **Private VIF vs Public VIF vs Transit VIF:** Private VIF vào một VPC bằng IP private, Public VIF vào dịch vụ AWS public trên đường DX, Transit VIF vào Transit Gateway để phục vụ nhiều VPC.
- **Transit Gateway vs VPC Peering:** VPC Peering là kết nối một-một, không bắc cầu, hợp với hai VPC. Transit Gateway là hub cho nhiều VPC, có bắc cầu qua route table và hỗ trợ hybrid.
- **Transit Gateway vs VPC Endpoint:** Transit Gateway định tuyến giữa VPC với VPC và on-premise. VPC Endpoint cho VPC gọi dịch vụ AWS như S3, DynamoDB mà không qua Internet hay NAT.
- **Direct Connect vs VPC Peering và PrivateLink:** Direct Connect nối on-premise với AWS. VPC Peering và PrivateLink nối giữa các VPC hoặc dịch vụ bên trong AWS, không liên quan on-premise.

## 8. Câu nhớ nhanh trước khi thi

> **Direct Connect là đường riêng vật lý: băng thông cao, độ trễ ổn định, không qua Internet, không mã hóa mặc định, dựng mất hàng tuần.**
>
> **VPN đi qua Internet, có IPsec, nhanh và rẻ. Cần kết nối ngay thì VPN. Cần mã hóa trên DX thì VPN over Direct Connect.**
>
> **Vào S3 hay DynamoDB là Public VIF. Vào một VPC là Private VIF. Vào nhiều VPC là Transit VIF với Transit Gateway.**
>
> **DX đơn là single point of failure. HA rẻ là DX cộng VPN. HA giữ hiệu năng là hai DX độc lập.**
>
> **Nhiều VPC theo hub-and-spoke là Transit Gateway. Chỉ hai VPC là VPC Peering. Peering không bắc cầu.**
>
> **Transit Gateway nối VPC với VPC và on-premise. VPC Endpoint nối VPC với dịch vụ AWS.**

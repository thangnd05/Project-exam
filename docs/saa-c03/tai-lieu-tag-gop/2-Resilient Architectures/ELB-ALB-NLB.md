# Elastic Load Balancing: Application Load Balancer và Network Load Balancer

> **Domain:** Resilient Architectures (exam Domain 2). Tag: ELB (Application / Network Load Balancer). ALB định tuyến thông minh ở tầng 7 cho ứng dụng web, NLB chuyển kết nối TCP/UDP ở tầng 4 với hiệu năng cực cao và IP tĩnh; đề liên tục bắt chọn đúng loại.
> **Mức độ ra đề:** Cực kỳ cao. ALB là xương sống của bộ ba kinh điển Route 53 => ALB => Auto Scaling Group, còn NLB bị so sánh trực tiếp với ALB qua các tiêu chí tầng (4 hay 7), hiệu năng, IP tĩnh và giao thức.
> **Cross-reference:** AWS-Auto-Scaling, Amazon-Route-53, AWS-KMS-ACM, Amazon-Cognito, AWS-Network-Protection, VPC-Endpoint, VPC-Traffic-Control, ElastiCache, DynamoDB, Managed-Compute, AWS-Global-Accelerator, AWS-Direct-Connect-Transit-Gateway.

## 1. Tổng quan: Elastic Load Balancing giải quyết vấn đề gì

Một website chạy trên một EC2 duy nhất sẽ quá tải khi traffic tăng và sập hoàn toàn khi máy đó hỏng. Elastic Load Balancing đặt một **điểm truy cập duy nhất** trước nhiều máy chủ ở nhiều Availability Zone, chia tải, loại máy hỏng ra khỏi vòng quay và che giấu hạ tầng nội bộ, nhờ đó hệ thống đạt **tính sẵn sàng cao**.

Cái khó trong đề không nằm ở việc có dùng load balancer hay không, mà ở chỗ **chọn loại nào**. Mỗi loại làm việc ở một tầng khác nhau của mô hình OSI, nên nhìn thấy những thông tin khác nhau về request.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Application Load Balancer (ALB)** | Load balancer tầng 7 cho HTTP, HTTPS, gRPC, WebSocket | Định tuyến theo URL path, hostname, header, query string; tích hợp WAF, Cognito, ACM |
| **Network Load Balancer (NLB)** | Load balancer tầng 4 cho TCP, UDP, TLS, TCP_UDP | Hàng triệu request mỗi giây, độ trễ cực thấp, IP tĩnh mỗi AZ, UDP, PrivateLink |
| **Target Group và Health Check** | Nhóm backend cùng cơ chế kiểm tra sức khỏe | Quyết định traffic đi đâu và loại target hỏng |
| **Cross-Zone và Deregistration Delay** | Cách chia tải giữa các AZ và cách gỡ target | Tránh lệch tải, không cắt ngang request đang xử lý |

> **Một câu định vị:** cần đọc nội dung HTTP (path, host, header), web app, microservices, container => **ALB**. Cần UDP, IP tĩnh để whitelist, hiệu năng cực cao hoặc làm cửa ngõ PrivateLink => **NLB**. Cần chèn firewall hay IDS/IPS của bên thứ ba vào luồng traffic => **Gateway Load Balancer (tầng 3)**. Classic Load Balancer là thế hệ cũ, xuất hiện trong đáp án thường là sai. Định tuyến giữa các region ở tầng DNS => Route 53, không phải ELB.

## 2. Application Load Balancer

ALB bắt buộc trải trên **ít nhất 2 AZ** và tự co giãn năng lực xử lý của chính nó. Client truy cập ALB qua **DNS Name**, ALB **không có IP cố định**. Cấu trúc gồm ba tầng: **Listener => Rule => Target Group**.

### 2.1. Listener, Rule và Target Group

Listener là cặp giao thức và cổng mà ALB lắng nghe, ví dụ HTTP cổng 80 hoặc HTTPS cổng 443. Mỗi Rule trong Listener có điều kiện định tuyến theo **path** (`/api`, `/images`), **host header** (`app.example.com` và `blog.example.com`), **query string** hoặc **IP client**, và có hành động là `Forward` tới Target Group, `Redirect` (ví dụ HTTP sang HTTPS) hoặc `Fixed-response` trả mã 4xx/5xx ngay tại ALB. Ngay tại Listener Rule, ALB còn xác thực người dùng qua **Amazon Cognito** hoặc nhà cung cấp **OIDC** trước khi request chạm tới backend.

Target của ALB có thể là **EC2 instance**, **địa chỉ IP private** (kể cả server on-premise qua VPN hoặc Direct Connect) và **hàm Lambda**. ALB gắn với ECS Service tự nhận diện **cổng động của container (Dynamic Port Mapping)**. Chỉ riêng ALB trải nhiều AZ là chưa đủ chịu lỗi, vì backend vẫn có thể dồn vào một AZ; phải để Auto Scaling Group rải instance ra nhiều AZ.

### 2.2. Sticky Sessions, SSL Termination và IP của client

Mặc định ALB chia request theo **Round Robin**. Nếu ứng dụng giữ session trong bộ nhớ của từng server thì người dùng bị đăng xuất khi reload; bật **Sticky Sessions** trên Target Group để ALB dùng cookie giữ một client ở một backend. Tuy nhiên, muốn tính sẵn sàng cao nhất và không phụ thuộc server cụ thể thì lưu session tập trung ở **ElastiCache hoặc DynamoDB**.

ALB giải mã HTTPS ngay tại load balancer (**SSL Termination**) rồi chuyển HTTP vào backend để giảm tải CPU. Chứng chỉ gắn vào HTTPS Listener lấy từ **ACM ở cùng region với ALB**, khác CloudFront vốn bắt buộc chứng chỉ ở `us-east-1`. Vì IP nguồn tới EC2 đã thành IP nội bộ của ALB, muốn biết IP thật của client phải đọc header **`X-Forwarded-For`**. AWS WAF gắn được vào ALB để chặn SQL Injection và XSS.

> **Pattern đề thi:** *Hai microservice `/orders` và `/users` muốn dùng chung một load balancer, người dùng phải đăng nhập trước khi request tới EC2* => **ALB với path-based routing về hai Target Group và Cognito trên Listener Rule**.

## 3. Network Load Balancer

NLB định tuyến theo **IP và cổng**, không nhìn vào nội dung HTTP. Nó hỗ trợ **TCP, UDP, TLS và TCP_UDP**, và **chỉ NLB hỗ trợ UDP** trong các loại ELB, nên game online, VoIP, IoT, DNS, syslog bắt buộc dùng NLB. NLB xử lý **hàng triệu request mỗi giây** với độ trễ cực thấp và chịu được traffic đột biến **mà không cần warm-up**, khác ALB và CLB cũ cần pre-warming.

NLB cấp **một IP tĩnh cho mỗi AZ** và cho gán **Elastic IP**, nên là đáp án khi đối tác cần whitelist IP trên firewall của họ. NLB **giữ nguyên IP nguồn của client** (với target dạng instance), backend thấy IP thật mà không cần `X-Forwarded-For`. NLB có thể giải mã TLS với chứng chỉ ACM, hoặc chuyển thẳng TLS xuống backend qua listener TCP. Target của NLB là **EC2 instance**, **IP** (kể cả on-premise qua Direct Connect hoặc VPN) và **ALB**. Health check hỗ trợ TCP, HTTP, HTTPS; NLB tích hợp Auto Scaling Group, ACM và Route 53 alias record.

NLB là **loại load balancer duy nhất làm cửa ngõ cho VPC Endpoint Service (AWS PrivateLink)** để expose ứng dụng cho VPC hoặc account khác một cách riêng tư, traffic đi trong mạng AWS mà không qua Internet. Gateway Load Balancer cũng đi qua PrivateLink, nhưng chỉ để đưa traffic vào dàn thiết bị bảo mật.

> **Pattern đề thi:** *Ứng dụng game dùng UDP, đối tác cần danh sách IP cố định để whitelist, traffic đột biến hàng triệu request mỗi giây* => **NLB với Elastic IP ở mỗi AZ**.

## 4. Cơ chế chung: Health Check, Deregistration Delay và Cross-Zone

Health check của ALB mặc định gửi **HTTP GET tới `/`**. Target chỉ bị coi là `Unhealthy` khi không trả đúng mã thành công (mặc định `200`, có thể đặt dải như `200-399`) hoặc không phản hồi trong thời gian timeout, **liên tiếp đủ số lần** `UnhealthyThresholdCount` (mặc định 2), chứ không phải cứ một lỗi 5xx là bị loại. Load balancer chỉ **ngừng gửi traffic** tới target hỏng; muốn instance được **thay thế** thì Auto Scaling Group phải bật **ELB Health Check**.

Khi gỡ một instance khỏi Target Group hoặc Auto Scaling Group sắp scale-in, target chuyển sang `Deregistering`: không nhận request mới nhưng được xử lý nốt request đang chạy trong **Deregistration Delay (Connection Draining), mặc định 300 giây**.

**Cross-Zone Load Balancing** chia tải đều cho mọi target ở mọi AZ, bất kể AZ nào nhận request. Trên ALB tính năng này **bật sẵn và miễn phí**. Trên NLB nó **tắt mặc định**, mỗi AZ chỉ chia tải trong AZ đó, và bật lên thì **tính phí data transfer giữa các AZ**.

> **Pattern đề thi:** *Hệ thống dùng NLB bị lệch tải nghiêm trọng giữa các AZ vì số instance mỗi AZ không bằng nhau* => **Cross-Zone Load Balancing đang tắt (mặc định trên NLB), bật lên và chấp nhận phí cross-AZ**.

## 5. Chọn load balancer trong nhóm

| Tiêu chí | ALB | NLB | Gateway Load Balancer |
|----------|-----|-----|-----------------------|
| Tầng OSI | 7 | 4 | 3 |
| Định tuyến theo path, host, header | **Có** | Không | Không |
| UDP | Không | **Có (duy nhất)** | Luồng IP |
| IP tĩnh hoặc Elastic IP mỗi AZ | Không, chỉ DNS Name | **Có** | Không phải mục đích |
| IP gốc của client tại backend | Qua `X-Forwarded-For` | **Giữ nguyên** | |
| Target đặc biệt | Lambda, container cổng động | ALB, IP on-premise | Thiết bị bảo mật |
| WAF, Cognito, Redirect | **Có** | Không | Không |
| Cửa ngõ PrivateLink để expose ứng dụng | Không | **Có** | Chỉ cho thiết bị bảo mật |
| Cross-Zone mặc định | Bật, miễn phí | Tắt, bật thì tính phí | |

Khi đề đòi **cả IP tĩnh lẫn định tuyến theo URL path**, đặt **NLB phía trước và ALB làm target của NLB** (target type Application Load Balancer chỉ có ở Target Group của NLB). NLB lo IP tĩnh, ALB lo định tuyến tầng 7.

> **Pattern đề thi:** *Đối tác chỉ mở firewall cho IP cố định nhưng ứng dụng cần định tuyến theo URL path tới nhiều microservice* => **NLB đứng trước, ALB làm target**.

## 6. Kịch bản thi

1. Web app cần chia traffic theo `/api` và `/images` hoặc theo hostname. => ALB với path-based hoặc host-based rule.
2. Game online hoặc VoIP dùng UDP, latency cực thấp. => NLB.
3. Khách hàng cần whitelist IP cố định của dịch vụ. => NLB với Elastic IP mỗi AZ.
4. Expose dịch vụ cho VPC hoặc account khác mà không qua Internet. => NLB kết hợp VPC Endpoint Service (PrivateLink).
5. Chặn SQL Injection và XSS ngay tại load balancer. => AWS WAF gắn vào ALB.
6. Tự chuyển toàn bộ HTTP sang HTTPS. => Redirect Action trên HTTP Listener cổng 80 của ALB sang cổng 443.
7. Người dùng thỉnh thoảng mất giỏ hàng khi lướt web. => Sticky Sessions; muốn sẵn sàng tối đa thì lưu session ở ElastiCache hoặc DynamoDB.
8. Chèn firewall của bên thứ ba vào mọi luồng traffic. => Gateway Load Balancer.

## 7. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Định tuyến theo URL path, hostname, header | **ALB** | NLB (không đọc HTTP) |
| Ứng dụng UDP: game, VoIP, IoT, DNS | **NLB** | ALB (không có UDP) |
| Cần IP tĩnh để whitelist firewall | **NLB** | ALB (chỉ có DNS Name) |
| Cần cả IP tĩnh lẫn định tuyến tầng 7 | **NLB đứng trước ALB** | Chỉ ALB hoặc chỉ NLB |
| Cần WAF chặn tấn công web | **ALB + WAF** | NLB (WAF không gắn NLB) |
| Lấy IP thật của client sau ALB | **Header `X-Forwarded-For`** | Đọc IP nguồn gói tin (là IP của ALB) |
| Backend cần IP gốc client một cách tự nhiên | **NLB** (giữ source IP) | ALB |
| Container ECS chạy cổng ngẫu nhiên | **ALB với Dynamic Port Mapping** | Cố định cổng trên từng host |
| Xác thực trước khi request tới EC2 | **Cognito hoặc OIDC trên Listener Rule của ALB** | Tự viết code xác thực trên EC2 |
| Lệch tải giữa các AZ trên NLB | **Cross-Zone đang tắt** | Tăng số instance |
| Target trả về một lỗi 5xx | Chỉ `Unhealthy` khi fail liên tiếp vượt ngưỡng | Cho rằng bị loại ngay |
| LB đánh dấu unhealthy nhưng instance không bị thay | **Bật ELB Health Check trên ASG** | Chỉnh health check của LB |
| Gỡ instance không cắt ngang request | **Deregistration Delay (300 giây mặc định)** | Xóa instance ngay |
| Chứng chỉ HTTPS cho ALB | **ACM cùng region với ALB** | ACM ở `us-east-1` (quy tắc của CloudFront) |
| Route tới server on-premise qua VPN hoặc Direct Connect | **Target type IP** | Target type instance |
| Đáp án dùng Classic Load Balancer | Chọn ALB hoặc NLB | CLB (legacy) |

## 8. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **ALB vs NLB:** ALB hiểu nội dung HTTP nên định tuyến được theo path, host, header và hỗ trợ WebSocket, redirect, WAF, Cognito, nhưng không có IP cố định. NLB chỉ nhìn IP và cổng, bù lại có IP tĩnh, hỗ trợ UDP và PrivateLink, giữ IP nguồn và nhanh hơn nhiều.
- **NLB vs Gateway Load Balancer:** Gateway Load Balancer làm việc ở tầng 3 để đưa traffic qua firewall, IDS hoặc IPS của bên thứ ba, không nhằm cân bằng tải ứng dụng như NLB.
- **NLB vs Classic Load Balancer:** Classic Load Balancer là thế hệ cũ mà AWS khuyến nghị tránh, mọi tính năng mới đều nằm ở ALB và NLB.
- **Sticky Sessions vs lưu session tập trung:** Sticky Sessions giữ khách ở một server nhưng server chết thì mất session. Lưu session ở ElastiCache hoặc DynamoDB giúp ứng dụng không trạng thái và sẵn sàng cao hơn.
- **ELB vs Route 53:** ELB chia tải giữa các target trong một region, còn Route 53 định tuyến ở tầng DNS, thường giữa các region, và trỏ tới ELB bằng Alias record. Hai tầng thường dùng cùng nhau.
- **Health check của ELB vs Auto Scaling Group:** ELB chỉ ngừng gửi traffic tới target hỏng. Việc thay instance mới là của Auto Scaling Group khi bật ELB Health Check.

## 9. Câu nhớ nhanh trước khi thi

> **ALB là tầng 7, định tuyến theo URL path hoặc hostname. Web app, microservices, container thì chọn ALB.**
>
> **NLB là tầng 4. Chỉ NLB có UDP, có IP tĩnh để whitelist, hiệu năng cực cao và là cửa ngõ PrivateLink.**
>
> **Cần cả IP tĩnh lẫn định tuyến theo path thì đặt NLB đứng trước ALB.**
>
> **IP thật của khách sau ALB nằm trong `X-Forwarded-For`. NLB giữ nguyên IP nguồn.**
>
> **Target chỉ Unhealthy khi fail liên tiếp vượt ngưỡng. Thay instance là việc của ASG khi bật ELB Health Check.**
>
> **Cross-Zone bật sẵn và miễn phí trên ALB, tắt mặc định và tính phí trên NLB.**
>
> **WAF và Cognito gắn vào ALB, không gắn NLB. Firewall bên thứ ba là Gateway Load Balancer. Classic Load Balancer gần như luôn sai.**

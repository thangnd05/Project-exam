# Chọn và bố trí Amazon EC2: instance family, Graviton, placement group và accelerator

> **Domain:** High-Performing Architectures (exam Domain 3). Tag: EC2-Instance-Selection (Instance Families / Graviton / Placement Groups / Accelerators). Chọn đúng họ instance theo nút thắt của workload, đúng kiến trúc CPU, đúng cách đặt máy trên phần cứng và đúng loại mạng, bộ nhớ tạm, chip tăng tốc.
> **Mức độ ra đề:** Cao. Đề hay đưa tỉ lệ RAM/vCPU, chữ aarch64, chữ MPI, chữ Kafka hoặc CUDA làm tín hiệu; bẫy chính là chọn R cho mọi bài có RAM, chọn EFA cho mọi bài mạng nhanh, dùng spread hoặc cluster sai chỗ, và đưa Graviton vào workload chỉ có x86.
> **Cross-reference:** Managed-Compute, Amazon-EBS-SSD, ELB-ALB-NLB, EC2-Purchasing-Options, AWS-Compute-Optimizer, AWS-Auto-Scaling, AI-ML-Services.

## 1. Tổng quan: chọn instance EC2 giải quyết vấn đề gì

Cùng một ứng dụng có thể rẻ gấp đôi hoặc chậm gấp bốn chỉ vì chọn sai máy. Một assembler gen nghẽn ở bộ nhớ nhưng chạy trên họ C thì phải mua thừa vCPU để gom đủ RAM. Một mô phỏng MPI đặt rải qua ba AZ thì thời gian chạy tăng vọt vì độ trễ giữa các node. Một API chạy CPU đều cả ngày trên họ T thì hết credit rồi p99 tăng gấp ba. Đề SAA-C03 cho sẵn dữ kiện profiling, việc của bạn là đọc ra nút thắt rồi ghép đúng khối kiến thức.

Bảy khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Instance family** | T, M, C, R/X, I/D, P/G, Inf/Trn | Khớp tỉ lệ RAM/vCPU, đĩa hoặc chip tăng tốc với nút thắt |
| **Graviton** | CPU ARM do AWS thiết kế (arm64/aarch64), hậu tố `g` như C7g, M7g, R7g | Giảm chi phí trên mỗi đơn vị công việc khi phần mềm đã có bản ARM |
| **Placement group** | Cluster, spread, partition | Quyết định máy nằm sát nhau hay tách phần cứng |
| **ENA và EFA** | Enhanced networking cho mạng thường, Elastic Fabric Adapter cho HPC | PPS cao và độ trễ thấp; EFA bỏ qua kernel cho MPI |
| **Instance store** | Ổ NVMe gắn vật lý vào host | Scratch cực nhanh, mất khi stop hoặc terminate |
| **Accelerator** | GPU NVIDIA (P/G), Inferentia (Inf), Trainium (Trn) | Chạy CUDA hoặc AWS Neuron cho ML |
| **Tenancy và nền tảng** | Dedicated Host, Fargate | License theo socket/core; hoặc không quản instance |

> **Một câu định vị:** thấy tỉ lệ RAM/vCPU => chọn **family** (C ~2, M ~4, R ~8 GiB/vCPU). Thấy aarch64 hoặc nhiều kiến trúc => **Graviton**. Thấy MPI, tightly coupled => **cluster + EFA**. Thấy vài máy cần sống sót khi hỏng rack => **spread**. Thấy Kafka, HDFS, Cassandra => **partition**. Thấy CUDA => **P/G**. Thấy Neuron => **Inf/Trn**. Thấy license theo socket => **Dedicated Host**.

## 2. Instance family và instance T burstable

Mỗi họ instance là một tỉ lệ tài nguyên cố định. Họ **C** (compute optimized) có khoảng **2 GiB RAM/vCPU**, hợp việc CPU-bound như encode video, API xử lý JSON nặng CPU. Họ **M** (general purpose) có khoảng **4 GiB RAM/vCPU**, hợp ứng dụng cân bằng như claims engine JVM. Họ **R** (memory optimized) có khoảng **8 GiB RAM/vCPU**, hợp workload memory-bound như cache, assembler gen, Java heap lớn; họ **X** còn nhiều RAM hơn nữa. Họ **I/D** tối ưu đĩa cục bộ (NVMe, throughput lớn), còn **P/G/Inf/Trn** là họ tăng tốc. Chọn họ có tỉ lệ khớp working set là cách rẻ nhất: chọn thiếu RAM thì phải mua thừa vCPU, chọn thừa RAM thì trả tiền cho bộ nhớ không dùng.

Họ **T** (T3, T4g...) là burstable: chạy ở mức CPU baseline, tích **CPU credit** khi nhàn rỗi và tiêu credit khi vượt baseline. Khi `CPUCreditBalance` về 0 ở chế độ standard thì CPU bị ghìm về baseline; ở chế độ **unlimited** máy vẫn chạy nhanh nhưng bị tính phí surplus credit. Vì vậy T chỉ hợp tải thấp, thất thường, có spike ngắn. Khi tải CPU đều nhiều giờ mỗi ngày, credit về 0 và hóa đơn surplus tăng, cách đúng là **rời họ T sang M hoặc C**, không phải đổi T lớn hơn, cũng không phải bật thêm unlimited.

> **Pattern đề thi:** *API trên t3/t4g chạy khoảng 70% CPU cả ngày, CPUCreditBalance về 0 giữa buổi sáng, unlimited đang đắt dần* => **Chuyển sang họ M hoặc C (Graviton nếu đã có bản ARM)**.

## 3. Graviton: khi nào dùng, khi nào không

Graviton là CPU ARM (kiến trúc **arm64/aarch64**) do AWS thiết kế, nhận ra qua chữ `g` trong tên như C7g, M7g, R7g, T4g. AWS công bố Graviton cho giá/hiệu năng tốt hơn tới khoảng 40% so với x86 tương đương, nên khi đề nói ứng dụng và thư viện native **đã có bản aarch64** hoặc **đã biên dịch cho nhiều kiến trúc** và muốn giảm chi phí trên mỗi đơn vị công việc, đáp án là **đúng family + Graviton**: R Graviton cho memory-bound, C Graviton cho CPU-bound, M Graviton cho cân bằng. Điều kiện tiên quyết là phần mềm chạy được trên ARM. Instance ARM không boot được AMI x86_64 và không có lớp dịch x86 miễn phí. Nếu vendor chỉ phát hành **AMI x86_64 với driver mã nguồn đóng**, workload phải ở lại họ x86 (ví dụ C6i, M6i) cho tới khi vendor cung cấp bản ARM. Fargate chạy ARM cũng vẫn là ARM, không cứu được binary x86.

> **Pattern đề thi:** *Gateway của vendor chỉ có AMI x86_64 với driver đóng, bộ phận tài chính muốn chuyển sang C7g để tiết kiệm 20%* => **Giữ họ x86 phù hợp, chỉ chuyển Graviton khi vendor có bản ARM**.

## 4. Placement group: cluster, spread, partition

**Cluster** đặt các instance sát nhau trong **một AZ**, trên cùng mạng băng thông cao và độ trễ thấp. Đây là lựa chọn cho HPC tightly coupled (MPI, CFD, mô phỏng va chạm, huấn luyện phân tán). Cái giá là rủi ro tập trung: sự cố rack hoặc AZ có thể hạ nhiều máy cùng lúc, nên cluster **không** dùng cho workload loosely coupled. Job song song độc lập (worker đọc SQS, ghi S3, không trao đổi MPI) không cần placement group nào; trải Auto Scaling group qua nhiều AZ để giảm blast radius.

**Spread** đặt từng instance trên phần cứng riêng (rack riêng, nguồn điện và mạng riêng), giới hạn **tối đa 7 instance đang chạy mỗi AZ** cho mỗi group, và có thể trải qua nhiều AZ. Hợp một nhóm nhỏ máy quan trọng như license server, cặp máy chủ chính và dự phòng.

**Partition** chia instance thành các partition, mỗi partition là một nhóm rack riêng, **tối đa 7 partition mỗi AZ**, mỗi partition chứa được nhiều instance. Ứng dụng nhận biết topology như **HDFS, HBase, Kafka, Cassandra** đặt các bản sao ở partition khác nhau để hỏng một rack không mất hết replica. Đây là lời giải khi cần rack awareness cho hàng chục node trong một AZ mà spread không chứa nổi.

> **Pattern đề thi:** *36 broker Kafka trong một AZ phải đặt replica trên rack khác nhau* => **Partition placement group, và không dùng cluster**. *32 node MPI đang đặt spread qua ba AZ, chậm gấp bốn lần* => **Chuyển sang cluster placement group trong một AZ**.

## 5. Mạng: ENA và EFA

**ENA** (Elastic Network Adapter, enhanced networking) có sẵn trên các instance Nitro thế hệ mới, cho PPS cao, băng thông lớn và độ trễ thấp cho lưu lượng TCP/UDP thông thường. Tắt ENA luôn là đi lùi. Bài toán nghẽn ở **packet rate** của dịch vụ mạng thông thường (market data fan-out, proxy) => bảo đảm ENA đang bật với instance và driver phù hợp. **EFA** (Elastic Fabric Adapter) là network interface dành cho HPC và ML phân tán, chỉ có trên một số instance type hỗ trợ. Nó có đường **OS-bypass** qua libfabric cho **MPI** và **NCCL**, cho độ trễ giữa các node thấp và ổn định hơn nhiều so với ENA. EFA đòi hỏi instance EC2 hỗ trợ, nên không dùng được trên Fargate hay Lambda. HPC tightly coupled chuẩn là **cluster placement group + EFA**.

> **Pattern đề thi:** *Mô phỏng MPI trên 64 instance, thời gian chạy phụ thuộc độ trễ giữa các rank* => **Cluster placement group + EFA**. *Dịch vụ TCP thường nghẽn ở hàng triệu packet/giây* => **ENA, không phải EFA**.

## 6. Instance store cho dữ liệu tạm tốc độ cao

**Instance store** là ổ (thường NVMe) gắn vật lý vào host, cho IOPS và throughput rất cao với độ trễ thấp. Dữ liệu tồn tại qua reboot nhưng **mất khi stop, hibernate hoặc terminate**, và không có snapshot như EBS. Nó hợp scratch, cache, file trung gian có thể tạo lại, khi nguồn sự thật hoặc checkpoint đã nằm ở S3. Dữ liệu bền như database hay journal thì dùng EBS; EBS gắn trong một AZ, io2 không có kiểu "Multi-AZ". Cần file system dùng chung nhiều máy thì dùng EFS hoặc FSx.

> **Pattern đề thi:** *Aligner ghi 4 TB shard trung gian, đọc ngẫu nhiên nặng, xóa khi job xong, kết quả cuối đã lên S3* => **Instance store NVMe**.

## 7. Accelerator: GPU NVIDIA vs Inferentia và Trainium

Họ **P** (huấn luyện quy mô lớn) và **G** (đồ họa, inference và training GPU vừa phải) mang GPU **NVIDIA**. Mọi thứ viết cho **CUDA, TensorRT, NVLink, nvidia-smi** cần P hoặc G, cộng driver và CUDA toolkit khớp phiên bản; Deep Learning AMI hoặc container NVIDIA là đường tắt. Huấn luyện nhiều node thường đi cùng cluster placement group và EFA, không trải qua nhiều Region. **Inferentia (Inf1, Inf2)** là chip AWS tối ưu **inference**, **Trainium (Trn1...)** là chip AWS tối ưu **training**; cả hai dùng **AWS Neuron SDK** và không chạy CUDA. Model đã biên dịch sang Neuron, cần inference số lượng lớn với chi phí thấp nhất => Inf. Họ CPU như C7g không có GPU hay Neuron.

> **Pattern đề thi:** *Model đã compile sang AWS Neuron, phục vụ hàng chục triệu inference mỗi ngày, cần chi phí thấp nhất* => **Inf2**. *Engine TensorRT gọi CUDA, cần đường GPU-to-GPU kiểu NVLink* => **Họ P hoặc G với driver NVIDIA**.

## 8. Fargate, EC2 launch type và Dedicated Host

**Fargate** là compute serverless cho container của ECS và EKS: khai báo vCPU và memory cho mỗi task hoặc pod, AWS lo máy chủ và vá hệ điều hành, mỗi task cách ly riêng, trả theo tài nguyên đã xin. Nó chạy được cả service dài hạn lẫn batch nhiều giờ, khác Lambda bị giới hạn 15 phút mỗi lần chạy. Nhưng Fargate **không gắn EFA** và không phải chỗ cho MPI tightly coupled, GPU NVIDIA hay appliance cần driver kernel; những trường hợp đó dùng **ECS/EKS trên EC2** (hoặc EC2 thuần) và chấp nhận việc vá AMI.

**Dedicated Host** là cả một máy chủ vật lý dành riêng cho bạn, **thấy được số socket và core**, kiểm soát host affinity. Đây là đáp án cho license **BYOL tính theo socket/core** (Oracle, Windows Server, SQL Server) hoặc yêu cầu tuân thủ về máy vật lý. Dedicated Instance chỉ bảo đảm phần cứng không chia sẻ với account khác, không cho thấy socket.

> **Pattern đề thi:** *Container chạy worker 3 giờ và API 24/7, không muốn vá AMI hay chọn instance type, trả theo vCPU/RAM từng task* => **Fargate**. *Mô hình thời tiết MPI cần EFA, đội platform đề xuất Fargate* => **ECS/EKS trên EC2 với instance hỗ trợ EFA, cluster placement group**.

## 9. Các câu liên quan hay đi kèm

- **ALB least outstanding requests:** thuật toán mặc định round robin chia đều kể cả cho target chậm nhưng vẫn pass health check. Đổi thuộc tính target group sang **least outstanding requests** để request mới đi tới target có ít request đang chờ nhất. Sticky session hay health check nhạy hơn không giải quyết được.
- **Access log của load balancer:** muốn thông tin từng request của client (IP, port, latency, path, status code, target) để phân tích traffic => **bật access logs ghi vào S3**. CloudWatch metric chỉ là số liệu gộp, CloudTrail chỉ ghi lời gọi API AWS, không thể cài agent lên load balancer. NLB chỉ có access log cho listener TLS.
- **NLB giữ IP client:** ứng dụng TCP đọc IP client từ socket, không muốn sửa code => **NLB target type instance**, client IP preservation bật sẵn. Được phép sửa code và cần đưa IP gốc qua luồng TCP => **NLB + Proxy Protocol v2**. X-Forwarded-For chỉ có với ALB và HTTP.
- **Compute Optimizer:** muốn khuyến nghị rightsizing từ lịch sử sử dụng thật cho EC2, Auto Scaling group, EBS, Lambda, ECS trên Fargate, kể cả gợi ý đổi family và chuyển Graviton => **AWS Compute Optimizer** (dựa trên metric CloudWatch, cài CloudWatch Agent để có metric bộ nhớ). Cost Explorer chỉ cho biết tiền đi đâu.

> **Pattern đề thi:** *Một instance chậm nhưng vẫn pass health check, ALB vẫn chia đều request cho nó* => **Đổi thuật toán của target group sang least outstanding requests**. *App TCP đọc IP client từ socket, không được sửa code* => **NLB target type instance**.

## 10. Kịch bản thi

1. Ứng dụng cần khoảng 8 GiB RAM/vCPU, đã có bản aarch64, muốn rẻ nhất trên mỗi đơn vị công việc. => Họ R Graviton.
2. Transcode CPU-bound khoảng 2 GiB RAM/vCPU, FFmpeg đã có bản ARM. => Họ C Graviton.
3. Claims engine khoảng 4 GiB RAM/vCPU, JVM và JNI đã có aarch64. => Họ M Graviton.
4. Năm license server phải sống khi hỏng một rack hoặc host. => Spread placement group.
5. 200 worker Monte-Carlo độc lập đọc SQS đang nằm trong cluster, một sự cố rack làm hỏng 80 máy. => Bỏ cluster, trải Auto Scaling group qua nhiều AZ.
6. API JSON CPU-bound, cần sống sót khi mất một AZ. => C Graviton sau ALB với Auto Scaling group đa AZ, không cluster, không EFA.
7. Oracle BYOL bị kiểm toán theo socket và core vật lý. => Dedicated Host.
8. Huấn luyện PyTorch cần CUDA và băng thông GPU-to-GPU. => Họ P/G kèm driver NVIDIA và CUDA.

## 11. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Memory-bound, 8 GiB/vCPU | **Họ R** (Graviton nếu có aarch64) | Họ C, họ I, thêm ALB |
| CPU-bound, 2 GiB/vCPU | **Họ C** | Họ R vì "càng nhiều RAM càng tốt" |
| CPU đều cả ngày trên T, hết credit | **Chuyển M hoặc C** | T lớn hơn, bật unlimited, placement group |
| AMI chỉ x86_64, driver đóng | **Ở lại họ x86** | Graviton, Fargate ARM |
| MPI tightly coupled | **Cluster + EFA, một AZ** | Spread đa AZ, Transit Gateway |
| Packet rate cao, không MPI | **ENA** | EFA |
| Kafka/HDFS/Cassandra nhiều node, tách rack | **Partition** | Spread (kẹt 7/AZ), cluster |
| Scratch vứt được, IOPS cực cao | **Instance store** | EBS io2, EFS, S3 Express One Zone |
| Model Neuron cần inference rẻ | **Inf2** | Họ P, Trn1 |
| CUDA/TensorRT | **Họ P/G** | Inf2, Trainium, C7g |
| MPI cần EFA nhưng không muốn vá AMI | **ECS/EKS trên EC2** | Fargate, Lambda |
| BYOL theo socket/core | **Dedicated Host** | Shared tenancy, Spot |

## 12. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Họ C vs M vs R:** cả ba đều chạy việc tính toán, khác nhau ở tỉ lệ bộ nhớ. Đọc con số GiB RAM trên mỗi vCPU trong đề là chọn được ngay, đừng mặc định R khi thấy chữ RAM hay C khi thấy chữ CPU.
- **Graviton vs x86:** Graviton rẻ hơn trên mỗi đơn vị công việc nhưng chỉ khi phần mềm có bản ARM. Đổi kiến trúc CPU là đổi ISA, không phải đổi kích cỡ.
- **Cluster vs spread vs partition:** cluster gom máy để giảm độ trễ, spread tách từng máy để tăng HA cho nhóm nhỏ, partition tách theo nhóm rack cho hệ phân tán nhiều node.
- **ENA vs EFA:** ENA là mạng nhanh cho mọi lưu lượng thông thường. EFA thêm đường bỏ qua kernel cho MPI và NCCL, chỉ có giá trị khi ứng dụng dùng libfabric.
- **Instance store vs EBS:** instance store nhanh nhất nhưng tạm thời, mất khi stop. EBS bền, có snapshot, dùng cho dữ liệu cần giữ.
- **Inferentia vs Trainium vs GPU:** Inferentia cho inference, Trainium cho training, cả hai dùng Neuron. GPU NVIDIA họ P/G dùng CUDA. Hai hệ sinh thái không thay thế cho nhau.
- **Fargate vs Lambda vs EC2:** Fargate chạy container không quản máy, không giới hạn thời gian như Lambda nhưng không có EFA. Lambda chạy tối đa 15 phút. EC2 cho toàn quyền với phần cứng đặc thù.
- **Dedicated Host vs Dedicated Instance:** cả hai không chia sẻ phần cứng với account khác, nhưng chỉ Dedicated Host cho thấy socket và core để tính license.

## 13. Câu nhớ nhanh trước khi thi

> **C ~2, M ~4, R ~8 GiB RAM/vCPU. T cho tải thất thường; CPU đều cả ngày thì chuyển M hoặc C.**
>
> **Có aarch64 hoặc nhiều kiến trúc => Graviton đúng family. AMI chỉ x86_64 => ở lại x86.**
>
> **MPI => cluster + EFA trong một AZ. Vài máy cần HA phần cứng => spread, tối đa 7 instance/AZ. Kafka, HDFS, Cassandra => partition.**
>
> **Packet rate cao cho mạng thường => ENA. EFA chỉ cho MPI và NCCL.**
>
> **Scratch vứt được, kết quả đã ở S3 => instance store.**
>
> **CUDA => P/G. Neuron inference => Inf. Neuron training => Trn.**
>
> **Không quản máy cho container => Fargate, trừ khi cần EFA, GPU hay driver kernel. License theo socket => Dedicated Host.**

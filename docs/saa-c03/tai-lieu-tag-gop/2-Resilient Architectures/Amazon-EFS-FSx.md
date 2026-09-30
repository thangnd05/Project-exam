# Amazon EFS và Amazon FSx

> **Domain:** Resilient Architectures (exam Domain 2). Tag: Amazon-EFS / Amazon-FSx (Shared File Storage). EFS là file system NFS chia sẻ cho Linux, FSx là bốn file system của bên thứ ba được AWS quản lý; đề bắt chọn đúng loại theo nền tảng và giao thức.
> **Mức độ ra đề:** Cao. Dạng hay gặp là nhiều EC2 cần cùng truy cập một bộ file, bẫy chọn giữa EFS, EBS và S3, và bẫy chọn đúng loại FSx theo từ khóa Windows, HPC, NetApp hay ZFS.
> **Cross-reference:** Amazon S3, Amazon-EBS-SSD, S3-Storage-Classes-and-Lifecycle, VPC-Traffic-Control, AWS-KMS-ACM, IAM-Identity-Center-Directory-Service, AWS-Direct-Connect-Transit-Gateway.

## 1. Tổng quan: EFS và FSx giải quyết vấn đề gì

Một cụm web server ở ba AZ cần cùng đọc và ghi một thư mục upload chung. EBS không làm được vì một volume (thường) chỉ gắn vào **một EC2 trong một AZ**. S3 cũng không làm được vì nó là object storage truy cập qua API, ứng dụng không mount nó như ổ đĩa để sửa file kiểu POSIX. Cần một **file system chia sẻ** mà nhiều máy cùng mount.

Câu hỏi tiếp theo là nền tảng nào: máy chủ Linux, máy chủ Windows gắn Active Directory, cụm tính toán hiệu năng cao, hay một hệ NAS đang chạy on-premise cần chuyển lên. Mỗi câu trả lời dẫn tới một dịch vụ khác nhau.

Năm khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Amazon EFS** | File system NFS được quản lý, chuẩn POSIX, chỉ cho Linux | Chia sẻ file đơn giản, tự co giãn, multi-AZ |
| **FSx for Windows File Server** | File system Windows qua SMB, NTFS, ACL, Active Directory | Shared storage cho ứng dụng Windows và .NET |
| **FSx for Lustre** | File system song song cho HPC, tích hợp S3 | Thông lượng hàng trăm GB/s cho HPC và machine learning |
| **FSx for NetApp ONTAP** | NetApp ONTAP được quản lý, NFS + SMB + iSCSI | Lift-and-shift NetApp on-premise, đa giao thức |
| **FSx for OpenZFS** | OpenZFS được quản lý qua NFS | Chuyển workload ZFS hoặc NAS Linux, snapshot và cloning |

> **Một câu định vị:** Linux cần file system chia sẻ đơn giản, tự co giãn => **EFS**. Windows, SMB, Active Directory => **FSx for Windows**. HPC, machine learning, dataset trên S3 => **FSx for Lustre**. NetApp hoặc cần cả NFS và SMB => **FSx for NetApp ONTAP**. ZFS => **FSx for OpenZFS**. Ổ riêng cho một EC2 => EBS. Lưu object qua API => S3.

## 2. Amazon EFS

EFS cho **hàng nghìn EC2 ở nhiều AZ** mount và đọc ghi đồng thời qua NFS, dung lượng **tự lớn nhỏ theo dữ liệu** mà không phải provision trước, và dữ liệu lưu qua nhiều AZ nên chịu được sự cố một AZ. EFS **chỉ hỗ trợ Linux**; Windows phải dùng FSx. Server on-premise mount được EFS qua **Direct Connect hoặc VPN**.

### 2.1. Chế độ hiệu năng và thông lượng

Performance mode **General Purpose** (mặc định) có độ trễ thấp, hợp web server và CMS; **Max I/O** cho thông lượng cao hơn nhưng độ trễ cao hơn, dành cho workload song song cực lớn, dù với EFS đời mới General Purpose đã đủ cho phần lớn trường hợp. Throughput mode **Bursting** (mặc định) tăng thông lượng theo dung lượng lưu trữ, **Provisioned** đặt thông lượng cố định cao khi dữ liệu ít mà cần thông lượng lớn, còn **Elastic** tự co giãn thông lượng cho workload khó đoán trước.

### 2.2. Lớp lưu trữ, truy cập và bảo mật

**EFS Standard** lưu qua nhiều AZ, còn **EFS One Zone** chỉ lưu trong một AZ nên rẻ hơn nhưng mất AZ là mất dữ liệu, hợp dev/test hoặc dữ liệu tái tạo được. File ít dùng nằm ở lớp **Infrequent Access** và **Archive**, và **Lifecycle Management** tự chuyển file không truy cập sau N ngày sang các lớp này, giống tinh thần Lifecycle của S3.

Mỗi AZ có một **mount target** với IP riêng. Truy cập được kiểm soát bằng **Security Group trên mount target, phải mở cổng NFS 2049** từ Security Group của EC2, cùng IAM và file system policy; dữ liệu mã hóa at-rest bằng KMS và in-transit bằng TLS. **EFS Access Points** áp sẵn user và thư mục gốc để mỗi ứng dụng chỉ thấy đúng thư mục với đúng quyền.

> **Pattern đề thi:** *Nhiều EC2 Linux ở nhiều AZ cần chung thư mục file, muốn giảm chi phí cho file ít truy cập mà không di chuyển thủ công* => **EFS Standard kết hợp Lifecycle Management sang Infrequent Access**.

## 3. Amazon FSx

FSx **không phải một sản phẩm duy nhất** mà là bốn file system hiệu năng cao của bên thứ ba, được **AWS quản lý hoàn toàn**, để bạn không phải tự dựng và vận hành chúng trên EC2. Đề chủ yếu kiểm tra việc ánh xạ từ khóa nền tảng sang đúng loại.

**FSx for Windows File Server** là file system gốc Windows dùng **SMB**, hỗ trợ **NTFS, ACL, shadow copies**, tích hợp **Microsoft Active Directory** và có triển khai **Multi-AZ**. **FSx for Lustre** dành cho **HPC, machine learning, xử lý video, phân tích dữ liệu lớn, mô phỏng tài chính hay khoa học**, với thông lượng hàng trăm GB/s và độ trễ cực thấp; nó **liên kết với một S3 bucket** để đọc dataset vào lớp file system tốc độ cao rồi ghi kết quả về S3, và có hai kiểu triển khai là **Scratch** (tạm thời, không replicate, rẻ) và **Persistent** (lâu dài, dữ liệu được replicate trong cùng AZ).

**FSx for NetApp ONTAP** phục vụ **lift-and-shift workload NetApp on-premise** gần như nguyên trạng, hỗ trợ đồng thời **NFS, SMB và iSCSI** cho môi trường lai Linux và Windows, kèm snapshot, cloning, **deduplication, compression** và **SnapMirror** để replicate. **FSx for OpenZFS** phục vụ chuyển **workload ZFS hoặc NAS Linux** qua **NFS**, có **snapshot tức thì và cloning**, dành cho khi cần tính năng ZFS mà không cần cả hệ sinh thái NetApp.

> **Pattern đề thi:** *Ứng dụng .NET cần shared storage tích hợp Active Directory qua SMB, còn một cụm khác huấn luyện machine learning trên dataset lưu ở S3* => **FSx for Windows File Server cho cụm thứ nhất, FSx for Lustre cho cụm thứ hai**.

## 4. Chọn dịch vụ trong nhóm

| Tiêu chí | EFS | FSx Windows | FSx Lustre | FSx NetApp ONTAP | FSx OpenZFS |
|----------|-----|-------------|------------|------------------|-------------|
| Giao thức | NFS | SMB | Lustre | NFS + SMB + iSCSI | NFS |
| Client chính | Linux | Windows | Linux (cụm HPC) | Linux và Windows | Linux |
| Điểm mạnh | Đơn giản, tự co giãn | AD, NTFS, ACL | Hàng trăm GB/s, tích hợp S3 | Đa giao thức, dedup, SnapMirror | Snapshot tức thì, cloning |
| Từ khóa đề | Linux, shared, nhiều AZ | Windows, SMB, AD | HPC, ML, high throughput | NetApp, NFS + SMB | ZFS, NAS Linux |

Hai cặp dễ nhầm nhất trong nhóm: FSx for Windows và FSx for NetApp ONTAP cùng hỗ trợ SMB, nhưng chỉ cần SMB cho Windows và AD thì chọn Windows File Server, còn cần **đồng thời NFS và SMB** hoặc đang dùng NetApp thì chọn ONTAP. EFS và FSx for OpenZFS cùng là NFS cho Linux, nhưng EFS dành cho file system mới cần tự co giãn, còn OpenZFS dành cho workload **đang chạy ZFS** cần chuyển lên.

> **Pattern đề thi:** *Công ty chuyển hệ NAS NetApp on-premise lên AWS với ít thay đổi nhất, máy Linux và Windows cùng truy cập* => **FSx for NetApp ONTAP**.

## 5. Kịch bản thi

1. Nhiều EC2 Linux ở nhiều AZ cần cùng đọc ghi một bộ file. => Amazon EFS Standard.
2. Ứng dụng Windows cần shared storage, Active Directory, SMB. => FSx for Windows File Server.
3. Huấn luyện machine learning trên dataset lớn lưu ở S3, cần thông lượng cực cao. => FSx for Lustre liên kết S3.
4. Cần đồng thời NFS và SMB, hoặc lift-and-shift NetApp. => FSx for NetApp ONTAP.
5. Chuyển workload ZFS lên AWS, cần snapshot và cloning. => FSx for OpenZFS.
6. Dữ liệu tái tạo được, muốn EFS rẻ hơn. => EFS One Zone.
7. EC2 không mount được EFS. => Mở cổng 2049 trên Security Group của mount target.

## 6. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Nhiều EC2 cần chung file | **EFS hoặc FSx** | EBS (ổ riêng một EC2) |
| Ứng dụng cần mount file system thật | **EFS hoặc FSx** | S3 (object qua API) |
| Shared file cho Windows | **FSx for Windows** | EFS (chỉ Linux) |
| HPC, thông lượng cực cao | **FSx for Lustre** | EFS Max I/O |
| Linux cần shared file đơn giản, tự co giãn | **EFS** | Một loại FSx |
| Cần cả NFS và SMB | **FSx for NetApp ONTAP** | FSx for Windows (chỉ SMB) |
| Giảm chi phí file ít dùng | **EFS Lifecycle Management** | Script tự chép file |
| Phải chịu lỗi khi một AZ sập | **EFS Standard** | EFS One Zone |
| EC2 không mount được EFS | **Security Group mount target mở 2049** | Đổi throughput mode |
| Mỗi app chỉ thấy đúng thư mục của mình | **EFS Access Points** | Tạo nhiều file system |
| Cần thông lượng cao mà dữ liệu ít | **Provisioned hoặc Elastic Throughput** | Bursting |
| File system hiệu năng cao, không muốn tự vận hành | **Loại FSx phù hợp** | Tự dựng trên EC2 |

## 7. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **EFS vs EBS:** EFS là file system chia sẻ mà nhiều EC2 ở nhiều AZ cùng mount, tự co giãn. EBS là block storage gắn (thường) một EC2 trong một AZ như ổ cứng riêng, hợp khi một instance cần ổ hiệu năng cao.
- **EFS và FSx vs S3:** EFS và FSx được mount như ổ đĩa để ứng dụng ghi sửa file trực tiếp. S3 là object storage truy cập qua API, hợp lưu object, backup, static asset.
- **FSx for Lustre vs S3:** Lustre không thay S3 làm kho lưu trữ; nó đọc dataset từ S3 vào lớp tốc độ cao để xử lý rồi ghi kết quả về S3.
- **EFS Standard vs EFS One Zone:** Standard lưu nhiều AZ nên bền và chịu lỗi AZ, One Zone rẻ hơn nhưng rủi ro khi mất AZ, giống cặp S3 Standard và S3 One Zone-IA.
- **EFS Lifecycle vs S3 Lifecycle:** cả hai tự chuyển dữ liệu ít truy cập sang lớp rẻ hơn sau N ngày; EFS chuyển sang Infrequent Access và Archive.

## 8. Câu nhớ nhanh trước khi thi

> **EFS là file system NFS chia sẻ cho nhiều EC2 Linux, multi-AZ, tự co giãn.**
>
> **EBS là ổ riêng một EC2 một AZ. S3 là object qua API. Shared file thì EFS hoặc FSx.**
>
> **FSx là bốn file system bên thứ ba được quản lý, chọn theo từ khóa nền tảng.**
>
> **Windows, SMB, AD là FSx for Windows. HPC, ML, S3 là FSx for Lustre. NetApp, NFS cộng SMB là ONTAP. ZFS là OpenZFS.**
>
> **File ít dùng thì Lifecycle Management. Dữ liệu tái tạo được thì One Zone.**
>
> **Không mount được EFS thì mở cổng 2049 trên Security Group của mount target. Thư mục riêng cho từng app thì Access Points.**

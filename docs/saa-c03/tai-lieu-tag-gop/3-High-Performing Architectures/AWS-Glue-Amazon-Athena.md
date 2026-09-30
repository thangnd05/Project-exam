# AWS Glue và Amazon Athena

> **Domain:** High-Performing Architectures (exam Domain 3). Tag: AWS-Glue / Amazon-Athena (Analytics). Cặp dịch vụ serverless để phân tích data lake trên S3: Glue dò schema, lưu metadata và biến đổi dữ liệu, Athena query SQL thẳng trên S3.
> **Mức độ ra đề:** Cao (cả Associate và Professional). Athena là đáp án mặc định cho query dữ liệu S3 bằng SQL không dựng server; Glue là đáp án mặc định cho ETL serverless và tạo schema cho data lake. Bẫy chính là nhầm Glue với Athena, và nhầm với EMR, Redshift, Redshift Spectrum, S3 Select, Firehose.
> **Cross-reference:** Amazon S3, Amazon-Kinesis-Data-Firehose, AWS-Lambda, AWS-Audit-Logging.

## 1. Tổng quan: Glue và Athena giải quyết vấn đề gì

Doanh nghiệp đổ hàng TB đến PB log và dữ liệu thô dạng CSV, JSON, Parquet, ORC về S3. Họ muốn query bằng SQL ngay mà không phải dựng một cụm data warehouse chạy 24/7, cũng không muốn dựng cụm Spark hay Hadoop chỉ để làm sạch và đổi định dạng dữ liệu. **Glue** lo phần chuẩn bị dữ liệu (dò schema, lưu metadata, ETL), còn **Athena** lo phần truy vấn, cả hai đều serverless.

Pipeline chuẩn hay gặp nhất trong đề:

```
Dữ liệu thô trong S3 => Glue Crawler (tự suy schema, cột, kiểu, partition)
   => Glue Data Catalog (bảng = metadata, không chứa dữ liệu)
   => (tùy chọn) Glue ETL job đổi CSV/JSON => Parquet/ORC, chia partition, ghi lại S3
   => Athena query SQL thẳng trên S3 (schema-on-read) => kết quả .csv ở S3 Query Result Location => QuickSight vẽ
```

Năm khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Glue Crawler** | Bộ quét S3 hoặc JDBC tự suy ra schema | Tạo và cập nhật bảng trong Data Catalog, không cần viết DDL |
| **Glue Data Catalog** | Kho **metadata** trung tâm (database, table, schema, partition) | Schema dùng chung cho Athena, Redshift Spectrum, EMR |
| **Glue ETL job** | Job Spark hoặc Python shell chạy serverless, tính theo DPU-giờ | Làm sạch, gộp, đổi định dạng, batch ETL theo lịch |
| **Glue DataBrew** | Công cụ làm sạch dữ liệu trực quan, no-code | Cho người phân tích không viết code |
| **Amazon Athena** | SQL serverless (Presto/Trino) query thẳng S3, tính **$5/TB dữ liệu quét** | Query ad-hoc data lake, phân tích log |

> **Một câu định vị:** thấy ETL, làm sạch, đổi định dạng không quản server hoặc tự tạo schema cho dữ liệu S3 => **Glue**. Thấy query ad-hoc dữ liệu S3 bằng SQL, trả theo dữ liệu quét => **Athena**. Thấy một file đơn lẻ => S3 Select. Thấy báo cáo BI chạy liên tục => Redshift. Thấy kiểm soát cụm Spark/Hadoop => EMR. Thấy nạp luồng streaming => Firehose. Thấy phân quyền data lake đến dòng/cột => Lake Formation.

## 2. AWS Glue: ETL serverless và Data Catalog

Glue là dịch vụ **ETL (Extract, Transform, Load) serverless**: trích dữ liệu từ nhiều nguồn, biến đổi và làm sạch, rồi nạp vào S3, Redshift hoặc RDS mà không cần dựng server. Glue tự cấp tài nguyên Spark hoặc Python cho job và tính tiền theo **DPU-giờ**, không chạy thì không tốn tiền.

**Data Catalog** chỉ lưu định nghĩa database, table, schema trỏ vào dữ liệu thật ở S3, nó **không lưu dữ liệu**. **Crawler** quét nguồn, tự suy ra cột, kiểu và partition rồi tạo hoặc cập nhật bảng trong Catalog, có thể chạy theo lịch để nhận partition mới. Nhiều đề chỉ cần Crawler và Catalog để Athena query được, hoàn toàn không cần chạy job ETL.

**ETL job** viết bằng PySpark, Spark Scala, hoặc Python shell cho job nhẹ; **Glue Studio** cho phép kéo thả tạo job. **Triggers và Workflows** lập lịch và nối nhiều job thành pipeline theo lịch, theo sự kiện hoặc chạy tay. **Job Bookmarks** ghi nhớ dữ liệu đã xử lý để lần chạy sau chỉ xử lý dữ liệu mới. Việc hay gặp nhất là đổi CSV/JSON sang **Parquet/ORC**, loại trùng, chuẩn hóa và join nhiều nguồn trước khi phân tích.

**DataBrew** dành cho người cần làm sạch dữ liệu bằng giao diện trực quan, không viết Spark. **Lake Formation** xây trên Glue Data Catalog để phân quyền tập trung cho data lake.

> **Pattern đề thi:** *Mỗi đêm cần đổi dữ liệu CSV mới trong S3 sang Parquet, không quản lý server, không xử lý lại dữ liệu cũ* => **Glue ETL job chạy bằng Trigger, bật Job Bookmarks**.

## 3. Amazon Athena: SQL serverless trên S3

Athena dùng **SQL chuẩn** để query dữ liệu nằm **nguyên tại S3**, không load vào database, không sao chép đi đâu. Athena không tự lưu cấu trúc bảng mà áp dụng **schema-on-read**: lúc chạy query mới khớp schema từ Glue Data Catalog vào dữ liệu thô. Mỗi query tự sinh một file kết quả `.csv` tại **S3 Query Result Location**, hệ thống khác lấy kết quả từ đó.

Ngữ cảnh ra đề điển hình là phân tích log trên S3 như **CloudTrail, VPC Flow Logs, ALB và CloudFront access log, S3 access log**, và khám phá nhanh data lake mà chưa cần xây pipeline ETL. Athena làm nguồn dữ liệu cho **QuickSight** vẽ dashboard. **Federated Query** dùng connector chạy trên Lambda để JOIN dữ liệu S3 với RDS, DynamoDB hoặc database on-premises trong một câu SQL. **Workgroups** tách môi trường query theo phòng ban và đặt **giới hạn dữ liệu quét** cho mỗi query hoặc cả nhóm để chặn chi phí vượt kiểm soát. Phân quyền đến từng **dòng và cột** thì tích hợp với **Lake Formation**.

### 3.1. Tối ưu chi phí và hiệu năng (trọng tâm đề thi)

Vì Athena tính tiền theo dữ liệu quét, tăng tốc query và giảm chi phí luôn đi cùng nhau. Định dạng cột **Parquet hoặc ORC** là vũ khí mạnh nhất, Athena chỉ đọc đúng các cột trong `SELECT` nên giảm được 80 đến 90% dữ liệu quét; chuyển đổi bằng Glue ETL, Firehose (với dữ liệu streaming) hoặc lệnh CTAS của Athena. **Nén** Snappy hoặc GZIP làm file nhỏ hơn. **Partition** theo thư mục như `year=2026/month=06/` giúp câu `WHERE month='06'` bỏ qua mọi thư mục khác.

Khi số partition lên hàng chục nghìn (log theo từng phút qua nhiều năm), việc đọc metadata từ Glue Data Catalog bị nghẽn và timeout. **Partition Projection** cho Athena tự tính vị trí file từ dải giá trị partition đã cấu hình, bỏ qua bước đọc Catalog.

> **Pattern đề thi:** *Query Athena trên log S3 chậm và tốn tiền, dữ liệu đang ở dạng CSV không phân vùng* => **Đổi sang Parquet, nén và chia partition**.

## 4. Chọn công cụ query và xử lý dữ liệu trên S3

| Nhu cầu | Chọn | Lý do |
|---------|------|-------|
| Query ad-hoc nhiều file, cả thư mục, JOIN, GROUP BY | **Athena** | Serverless, trả theo dữ liệu quét |
| Lọc một phần nhỏ từ **một** object CSV/JSON | **S3 Select** | Rẻ hơn, không cần Glue Catalog (AWS đã ngừng mở cho khách hàng mới từ 2024, đề vẫn có thể nhắc) |
| Báo cáo BI phức tạp chạy liên tục, lặp lại | **Redshift** | Data warehouse, hiệu năng cao bền vững |
| Đã có Redshift, muốn JOIN kho với dữ liệu thô trên S3 | **Redshift Spectrum** | Không dựng thêm Athena độc lập gây phân mảnh hạ tầng |
| ETL serverless, ít quản lý | **Glue** | Không dựng cụm |
| Big data quy mô lớn cần kiểm soát cụm Spark/Hadoop | **EMR** | Tùy biến framework, bạn quản cụm |

> **Pattern đề thi:** *Công ty đã chạy Redshift cho báo cáo và muốn query thêm dữ liệu lịch sử nằm trên S3 mà không load vào kho* => **Redshift Spectrum**.

## 5. Kịch bản thi

1. Query log CloudTrail hoặc VPC Flow Logs trên S3 bằng SQL, không dựng server. => Athena.
2. Tự tạo bảng cho dữ liệu mới đổ vào S3 để Athena dùng. => Glue Crawler ghi vào Data Catalog.
3. Query Athena timeout metadata vì quá nhiều partition. => Partition Projection.
4. Giới hạn chi phí query theo từng phòng ban. => Athena Workgroups với giới hạn dữ liệu quét.
5. Phân quyền đến từng dòng và cột khi query data lake. => Lake Formation kết hợp Athena.
6. JOIN dữ liệu S3 với RDS và DynamoDB trong một câu SQL. => Athena Federated Query.
7. Người phân tích muốn làm sạch dữ liệu không viết code. => Glue DataBrew.
8. Nạp luồng dữ liệu streaming vào S3 near-real-time. => Amazon Data Firehose, không phải Glue.

## 6. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Query SQL dữ liệu S3, trả theo dữ liệu quét | **Athena** | Redshift (phải dựng cụm) |
| Biến đổi, làm sạch dữ liệu không quản server | **Glue** | Athena (chỉ query) |
| Kho metadata dùng chung Athena, Redshift Spectrum, EMR | **Glue Data Catalog** | Cho rằng Athena lưu schema |
| Athena chậm và đắt trên CSV | **Parquet/ORC + nén + partition** | Tăng tài nguyên (Athena serverless) |
| Quá nhiều partition gây timeout metadata | **Partition Projection** | Chạy Crawler thường xuyên hơn |
| Chặn query quét quá nhiều dữ liệu theo nhóm | **Athena Workgroups** | AWS Budgets (chỉ theo dõi, không giới hạn từng query) |
| Bảo mật dòng/cột khi query | **Lake Formation** | S3 bucket policy |
| Lấy kết quả query sang hệ thống khác | File `.csv` ở **S3 Query Result Location** | Tự viết export |
| Lọc subset từ một file đơn lẻ | **S3 Select** | Athena |
| BI chạy liên tục, query phức tạp lặp lại | **Redshift** | Athena (chỉ hợp ad-hoc) |
| Big data cần kiểm soát cụm Spark/Hadoop | **EMR** | Glue |
| Pipeline điều phối nhiều bước ETL | **Glue Workflows** (hoặc Step Functions) | Cron trên EC2 |

## 7. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Glue vs Athena:** Glue chuẩn bị dữ liệu bằng ETL và giữ schema trong Data Catalog. Athena chỉ là công cụ thực thi query, đọc schema từ Catalog để map vào dữ liệu thô khi chạy lệnh.
- **Data Catalog vs Glue ETL job:** Catalog là metadata, không chứa dữ liệu. ETL job mới xử lý dữ liệu thật, và đề chỉ cần Athena query được thì Crawler cộng Catalog là đủ.
- **Glue vs EMR:** Glue là ETL serverless, ít quản lý, hợp job vừa phải. EMR là cụm Spark/Hadoop bạn tự quản, hợp big data quy mô lớn cần tùy biến cao.
- **Glue vs Firehose:** Glue mặc định là ETL batch theo lịch trên dữ liệu đã ở S3. Firehose nạp dữ liệu streaming near-real-time và đổi JSON sang Parquet ngay trên đường đi.
- **Glue vs Lake Formation vs DataBrew:** Glue lo ETL và Catalog. Lake Formation lo phân quyền tập trung cho data lake. DataBrew lo làm sạch dữ liệu no-code.
- **Athena vs S3 Select:** Athena query nhiều file, nhiều nguồn với JOIN và aggregate. S3 Select chỉ lọc dữ liệu trong một object bằng SQL đơn giản để ứng dụng tải ít dữ liệu hơn.
- **Athena vs Redshift vs Redshift Spectrum:** Athena hợp query thỉnh thoảng, trả theo query. Redshift là data warehouse cho BI chạy liên tục. Redshift Spectrum giúp cụm Redshift sẵn có query ra dữ liệu trên S3.

## 8. Câu nhớ nhanh trước khi thi

> **S3 thô => Glue Crawler => Glue Data Catalog => (Glue ETL đổi Parquet) => Athena query => QuickSight vẽ.**
>
> **Glue là ETL serverless cộng Data Catalog. Catalog chỉ là metadata, không lưu dữ liệu.**
>
> **Athena là SQL serverless query thẳng S3, trả $5/TB dữ liệu quét, kết quả ra file .csv trên S3.**
>
> **Muốn Athena rẻ và nhanh => Parquet/ORC, nén, partition. Quá nhiều partition => Partition Projection.**
>
> **Bảo mật dòng/cột => Lake Formation. Giới hạn chi phí theo nhóm => Workgroups. Chỉ xử lý dữ liệu mới => Job Bookmarks.**
>
> **Một file => S3 Select. Nhiều file => Athena. BI liên tục => Redshift. Redshift query ra S3 => Spectrum. Kiểm soát cụm => EMR. Streaming => Firehose.**

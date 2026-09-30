# Amazon Kinesis và Amazon Data Firehose

> **Domain:** High-Performing Architectures (exam Domain 3). Tag: Amazon-Kinesis / Amazon-Data-Firehose (Streaming). Họ dịch vụ thu nhận và xử lý dữ liệu luồng thời gian thực: Data Streams giữ luồng cho nhiều consumer đọc và đọc lại, Data Firehose tự nạp luồng vào kho lưu trữ.
> **Mức độ ra đề:** Cao. Đáp án mặc định cho streaming thời gian thực, replay, nhiều consumer đọc cùng luồng, và nạp luồng vào S3/Redshift/OpenSearch với ít công quản lý nhất. Bẫy chính là nhầm với SQS và nhầm giữa Data Streams, Firehose, Flink, Video Streams.
> **Cross-reference:** Amazon-SQS, Amazon-SNS, AWS-Lambda, Amazon S3, AWS-Glue-Amazon-Athena, AI-ML-Services.

## 1. Tổng quan: Kinesis và Data Firehose giải quyết vấn đề gì

Hàng nghìn nguồn như log máy chủ, cảm biến IoT, clickstream của website và metric ứng dụng bắn dữ liệu liên tục mỗi giây. Nếu đẩy vào SQS thì mỗi message chỉ được một consumer xử lý rồi bị **xóa**, nên không thể cho nhiều ứng dụng cùng đọc một luồng, cũng không thể đọc lại dữ liệu cũ khi phát hiện lỗi. Kinesis giải quyết việc đó bằng cách **giữ dữ liệu trong một khoảng retention**, cho **nhiều consumer đọc cùng lúc** và **replay** từ một vị trí trước đó.

AWS đã đổi tên hai dịch vụ trong họ này và đề có thể dùng cả tên cũ lẫn tên mới. **Kinesis Data Firehose** nay là **Amazon Data Firehose**, vẫn là cùng một dịch vụ. **Kinesis Data Analytics** nay là **Amazon Managed Service for Apache Flink**, bản Kinesis Data Analytics for SQL cũ đã deprecated.

Bốn khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Kinesis Data Streams** | Luồng dữ liệu chia thành **shard**, lưu 24 giờ đến 365 ngày | Thu và giữ luồng thời gian thực (~200ms), consumer tự xử lý, replay được |
| **Amazon Data Firehose** | Dịch vụ nạp (delivery) fully managed, không có shard | Tự đổ luồng vào S3, Redshift, OpenSearch, Splunk, HTTP endpoint ở mức near-real-time |
| **Managed Service for Apache Flink** | Ứng dụng Apache Flink được quản lý (Java, Scala, Python, SQL) | Phân tích stateful, aggregate theo cửa sổ thời gian ngay trên luồng |
| **Kinesis Video Streams** | Luồng video và media từ camera, thiết bị | Thu, lưu và đưa video cho Rekognition hoặc ML xử lý |

> **Một câu định vị:** thấy thời gian thực kèm replay, nhiều consumer, tự viết consumer => **Data Streams**. Thấy đổ luồng vào S3/Redshift/OpenSearch, không code consumer, ít quản lý nhất => **Data Firehose**. Thấy phân tích hoặc SQL trên luồng, stateful, windowing => **Managed Flink**. Thấy luồng video từ camera => **Video Streams**. Thấy job queue xử lý xong thì xóa => SQS. Thấy thông báo fan-out tới subscriber => SNS. Thấy ETL batch theo lịch => Glue.

## 2. Kinesis Data Streams

**Shard** là đơn vị throughput: mỗi shard ghi được **1 MB/s hoặc 1.000 record/s** và đọc được **2 MB/s**, tổng throughput bằng số shard nhân giới hạn mỗi shard. Ghi quá sức chứa sẽ gặp lỗi **ProvisionedThroughputExceeded**, cách xử lý là thêm shard hoặc chuyển sang On-Demand.

Có hai **capacity mode**. Ở **Provisioned**, bạn tự đặt số shard, tự split hoặc merge shard và trả tiền theo shard-giờ, hợp khi tải đoán trước được. Ở **On-Demand**, stream tự co giãn theo tải và tính tiền theo lượng dữ liệu, hợp khi throughput không đoán trước và không muốn quản shard.

Dữ liệu được giữ mặc định **24 giờ** và kéo dài được tới **365 ngày**, nhờ đó consumer có thể **replay** từ đầu, từ một mốc thời gian hoặc một vị trí cũ. **Partition key** quyết định record vào shard nào, và thứ tự chỉ được đảm bảo **trong một shard**, nên cần thứ tự theo từng người dùng thì đặt partition key là user_id. Key phân bố lệch tạo ra **hot shard**, khi đó phải chọn partition key phân bố đều hơn.

Ở chế độ mặc định, các consumer **chia chung 2 MB/s** đọc của mỗi shard. Bật **Enhanced Fan-Out** thì mỗi consumer có **2 MB/s riêng**, dữ liệu được đẩy tới thay vì phải poll, độ trễ thấp hơn. Consumer phổ biến là Lambda (xử lý serverless), ứng dụng KCL trên EC2, Firehose và Managed Flink.

> **Pattern đề thi:** *Nhiều ứng dụng đọc cùng một luồng clickstream, cần đọc lại dữ liệu 3 ngày trước, mỗi ứng dụng cần throughput riêng* => **Kinesis Data Streams với retention dài hơn và Enhanced Fan-Out**.

## 3. Amazon Data Firehose (tên cũ Kinesis Data Firehose)

Firehose nhận luồng dữ liệu và **tự động nạp vào đích**, không có shard, không có consumer để viết, tự co giãn và tính tiền theo lượng dữ liệu đi qua. Nguồn có thể là ghi trực tiếp qua SDK hoặc Kinesis Agent, một Kinesis Data Stream, Amazon MSK hoặc CloudWatch Logs. Đích gồm **S3**, **Redshift** (Firehose ghi tạm vào S3 rồi chạy lệnh COPY), **OpenSearch**, **Splunk**, HTTP endpoint và các đối tác bên thứ ba, mỗi Firehose stream giao tới một đích chính.

Firehose gom dữ liệu vào **buffer theo kích thước hoặc theo thời gian** rồi mới ghi, với buffer thời gian truyền thống tối thiểu khoảng **60 giây**, vì vậy đề luôn coi Firehose là **near-real-time** chứ không phải thời gian thực. Firehose **không lưu dữ liệu và không replay**, dữ liệu chỉ chảy qua rồi vào đích.

Trên đường đi, Firehose có thể gọi **Lambda để biến đổi** record (làm sạch, che dữ liệu nhạy cảm, đổi log thô sang JSON). Khi đích là S3, nó **chuyển đổi định dạng JSON sang Parquet hoặc ORC** sẵn có dựa trên schema trong **Glue Data Catalog**, nén GZIP hoặc Snappy, và dùng **dynamic partitioning** để chia dữ liệu theo prefix, giúp Athena query rẻ và nhanh. Record xử lý lỗi được ghi ra một **S3 backup bucket**.

> **Pattern đề thi:** *Đưa log streaming vào S3 dạng Parquet để Athena query, không muốn quản lý hạ tầng hay viết consumer* => **Amazon Data Firehose với record format conversion**.

## 4. Managed Service for Apache Flink (tên cũ Kinesis Data Analytics)

Dịch vụ này chạy ứng dụng Apache Flink fully managed để **phân tích luồng thời gian thực**, ví dụ aggregate theo cửa sổ thời gian, join nhiều luồng, phát hiện bất thường, với khả năng giữ trạng thái giữa các sự kiện. Nguồn thường là Kinesis Data Streams hoặc Amazon MSK, và có thể viết bằng SQL. Đề cũ ghi "Kinesis Data Analytics" thì hiểu cùng vai trò là phân tích hoặc SQL trên luồng.

> **Pattern đề thi:** *Tính số giao dịch mỗi phút trên luồng dữ liệu và phát hiện bất thường theo thời gian thực* => **Managed Service for Apache Flink**.

## 5. Kinesis Video Streams

Video Streams thu nhận, lưu trữ và phát lại luồng **video** từ camera an ninh, thiết bị IoT hoặc điện thoại, rồi đưa cho **Rekognition Video** hoặc mô hình ML phân tích. Dữ liệu dạng record như log hay sự kiện thì không thuộc Video Streams mà thuộc Data Streams hoặc Firehose.

> **Pattern đề thi:** *Phân tích khuôn mặt trên luồng video từ camera theo thời gian thực* => **Kinesis Video Streams kết hợp Rekognition**.

## 6. So sánh Data Streams và Data Firehose

| Tiêu chí | Kinesis Data Streams | Amazon Data Firehose |
|----------|----------------------|----------------------|
| Capacity | **Shard**, chọn Provisioned hoặc On-Demand | Không có shard, luôn tự co giãn |
| Độ trễ | Thời gian thực (~200ms) | **Near-real-time** (buffer, truyền thống ~60 giây) |
| Retention và replay | 24 giờ đến 365 ngày, **replay được** | **Không lưu, không replay** |
| Consumer | Nhiều consumer, có Enhanced Fan-Out | Không có consumer, giao tới một đích |
| Đích | Tự viết consumer ghi đi đâu cũng được | S3, Redshift (qua S3 + COPY), OpenSearch, Splunk, HTTP endpoint |
| Biến đổi và định dạng | Tự code trong consumer | **Lambda transform**, **JSON => Parquet/ORC**, nén, dynamic partitioning |
| Thứ tự | Đảm bảo trong shard theo partition key | Không dùng cho bài toán thứ tự |
| Công quản lý | Cao hơn (shard, consumer, checkpoint) | **Thấp nhất** |

Hai dịch vụ hay được ghép nối: producer ghi vào **Data Streams**, Lambda hoặc Flink đọc để xử lý thời gian thực, đồng thời **Firehose** cũng đọc stream đó để lưu lâu dài vào S3 cho Athena query.

> **Pattern đề thi:** *Vừa cảnh báo gian lận trong vài trăm mili giây vừa lưu toàn bộ sự kiện vào S3 để phân tích sau* => **Data Streams cho xử lý thời gian thực, Firehose đọc cùng stream để nạp vào S3**.

## 7. Kịch bản thi

1. Producer cần replay dữ liệu trong 24 giờ, consumer tự viết. => Kinesis Data Streams.
2. Đẩy log vào S3 hoặc Redshift, không viết consumer. => Amazon Data Firehose.
3. Phân tích thời gian thực có trạng thái trên luồng. => Managed Service for Apache Flink.
4. Cần thứ tự message theo từng người dùng. => Data Streams với partition key là user_id.
5. Stream báo ProvisionedThroughputExceeded, tải không đoán trước. => Thêm shard hoặc chuyển On-Demand.
6. Một shard quá tải trong khi các shard khác rảnh. => Chọn partition key phân bố đều hơn.
7. Đưa luồng JSON vào S3 dạng Parquet cho Athena. => Firehose record format conversion với schema Glue Data Catalog.
8. Đã có hệ sinh thái Apache Kafka, muốn chuyển lên AWS ít sửa code. => Amazon MSK.

## 8. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Luồng thời gian thực, nhiều consumer, replay | **Data Streams** | SQS (xóa sau khi xử lý) |
| Đổ luồng vào S3/Redshift/OpenSearch, ít quản lý nhất | **Data Firehose** | Data Streams kèm consumer tự viết |
| Cần replay nhưng chỉ dùng Firehose | Đặt **Data Streams** phía trước | Cho rằng Firehose lưu và replay được |
| Yêu cầu độ trễ dưới một giây | **Data Streams** | Firehose (near-real-time do buffer) |
| Biến đổi hoặc che dữ liệu trước khi vào S3 | **Firehose + Lambda transform** | Consumer tự viết trên EC2 |
| Nhiều consumer tranh 2 MB/s mỗi shard | **Enhanced Fan-Out** | Thêm consumer chế độ chia chung |
| Cần đọc lại dữ liệu cũ hơn 24 giờ | Tăng **retention** (tối đa 365 ngày) | Firehose hoặc SQS |
| Fan-out thông báo tới nhiều subscriber | **SNS** | Kinesis |
| Batch ETL theo lịch hằng đêm | **Glue** | Firehose |
| Đề ghi "Kinesis Data Firehose" và "Amazon Data Firehose" | **Cùng một dịch vụ** | Coi là hai đáp án khác nhau |

## 9. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Kinesis vs SQS:** Kinesis là stream giữ dữ liệu theo retention, cho nhiều consumer đọc và replay, đúng thứ tự trong shard. SQS là hàng đợi, mỗi message được một consumer xử lý rồi xóa và không replay được.
- **Kinesis vs SNS:** SNS là pub/sub đẩy thông báo tới subscriber. Kinesis là đường ống thu nhận và xử lý dữ liệu có thứ tự và replay được.
- **Data Streams vs Firehose:** Data Streams cho kiểm soát chi tiết, độ trễ thấp và replay nhưng phải quản shard và consumer. Firehose fully managed, near-real-time, tự đổ vào đích nhưng không replay.
- **Firehose vs Managed Flink:** Firehose chỉ giao dữ liệu và biến đổi nhẹ từng record qua Lambda. Flink phân tích có trạng thái như cửa sổ thời gian, aggregate và join luồng.
- **Firehose vs Glue:** Firehose nạp dữ liệu streaming vào đích và đổi JSON sang Parquet ngay trên đường đi. Glue chạy ETL batch trên dữ liệu đã nằm trong S3; Glue có streaming ETL nhưng đề mặc định coi Glue là batch.
- **Kinesis vs MSK:** MSK là Apache Kafka được quản lý, chọn khi đã dùng Kafka. Kinesis là streaming native của AWS, ít công quản lý hơn.

## 10. Câu nhớ nhanh trước khi thi

> **Kinesis giữ dữ liệu để nhiều consumer đọc và replay. SQS xóa message sau khi xử lý.**
>
> **Data Streams: shard ghi 1 MB/s hoặc 1.000 record/s, đọc 2 MB/s, retention 24 giờ đến 365 ngày, thời gian thực.**
>
> **Firehose: tự đổ vào S3/Redshift/OpenSearch/Splunk, near-real-time, không replay, có Lambda transform và JSON => Parquet/ORC.**
>
> **Kinesis Data Firehose là Amazon Data Firehose. Kinesis Data Analytics là Managed Service for Apache Flink.**
>
> **Tải không đoán trước => On-Demand. Shard nóng => sửa partition key. Consumer tranh throughput => Enhanced Fan-Out.**
>
> **Streaming => Kinesis/Firehose. Batch ETL => Glue. Hàng đợi => SQS. Thông báo => SNS. Đã có Kafka => MSK.**

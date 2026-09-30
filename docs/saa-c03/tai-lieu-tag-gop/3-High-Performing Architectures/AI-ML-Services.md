# Amazon Rekognition, Amazon Comprehend Medical và các dịch vụ AI

> **Domain:** High-Performing Architectures (exam Domain 3). Tag: AI-ML-Services (Rekognition / Comprehend Medical). Nhóm dịch vụ AI được quản lý sẵn, gọi API là dùng được, không cần huấn luyện mô hình hay biết ML.
> **Mức độ ra đề:** Trung bình đến thấp. SAA-C03 chỉ hỏi ở mức nhận diện dịch vụ nào làm việc gì, không đi sâu kỹ thuật ML. Bẫy chính là chọn sai dịch vụ khi nhìn nhầm loại dữ liệu đầu vào (ảnh, tài liệu, văn bản, giọng nói).
> **Cross-reference:** Amazon S3, AWS-Lambda, Amazon-SNS, Amazon-Kinesis-Data-Firehose, DynamoDB.

## 1. Tổng quan: các dịch vụ AI/ML giải quyết vấn đề gì

Một mạng xã hội cần tự động lọc ảnh khiêu dâm, bạo lực mà người dùng tải lên. Một bệnh viện có hàng triệu ghi chú bác sĩ viết tự do và muốn trích ra tên bệnh, tên thuốc, liều dùng, đồng thời ẩn thông tin sức khỏe cá nhân trước khi chia sẻ. Không đội nào muốn tự thu thập dữ liệu, huấn luyện và vận hành mô hình ML cho những việc phổ biến như vậy. AWS cung cấp sẵn các dịch vụ AI chỉ cần gọi API, và câu hỏi trong đề gần như luôn là **chọn đúng dịch vụ theo loại đầu vào**.

Ba khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Amazon Rekognition** | Phân tích **ảnh và video** bằng ML | Nhận diện vật thể, khuôn mặt, kiểm duyệt nội dung, chữ trong ảnh đời thường, đồ bảo hộ |
| **Amazon Comprehend Medical** | NLP chuyên cho **văn bản y tế** | Trích bệnh, thuốc, triệu chứng, phát hiện PHI, gán mã ICD-10-CM và RxNorm |
| **Các dịch vụ AI dễ nhầm** | Textract, Comprehend, Transcribe, Polly, Translate, Lex, Kendra, SageMaker | Thường xuất hiện làm đáp án nhiễu, cần nhận ra theo đầu vào |

> **Một câu định vị:** thấy **ảnh hoặc video** => **Rekognition**. Thấy **văn bản y tế** hoặc PHI => **Comprehend Medical**. Thấy văn bản thường (cảm xúc, thực thể) => Comprehend. Thấy tài liệu scan, form, PDF => Textract. Thấy giọng nói ra chữ => Transcribe. Thấy chữ ra giọng nói => Polly. Thấy tự huấn luyện mô hình riêng => SageMaker.

## 2. Amazon Rekognition

Rekognition phân tích ảnh và video mà bạn không cần huấn luyện mô hình. Nó phát hiện **vật thể, cảnh và hoạt động**; phát hiện, so khớp và phân tích **khuôn mặt** (cảm xúc, độ tuổi, giới tính); đọc **chữ trong ảnh đời thường** như biển số, biển hiệu; **kiểm duyệt nội dung** không phù hợp; nhận diện người nổi tiếng; phát hiện công nhân thiếu **đồ bảo hộ lao động (PPE)**; và kiểm tra **face liveness** để chống giả mạo khuôn mặt.

### 2.1. Kiến trúc hay gặp

Pipeline serverless kinh điển là ảnh được tải lên **S3**, sự kiện S3 kích hoạt **Lambda**, Lambda gọi **Rekognition** rồi lưu kết quả vào DynamoDB hoặc S3. Với ảnh tĩnh, API chạy đồng bộ; với video dài, Rekognition xử lý **bất đồng bộ** và báo kết quả qua **SNS**. Muốn phân tích video trực tiếp từ camera theo thời gian thực thì dùng **Kinesis Video Streams kết hợp Rekognition**.

> **Pattern đề thi:** *Ứng dụng mạng xã hội cần tự động chặn ảnh không phù hợp ngay khi người dùng tải lên S3, ít quản lý nhất* => **S3 event => Lambda => Rekognition content moderation**.

## 3. Amazon Comprehend Medical

Comprehend Medical là dịch vụ **NLP chuyên cho văn bản y tế phi cấu trúc** như bệnh án, ghi chú bác sĩ, đơn thuốc. Nó trích xuất **thực thể y khoa** gồm bệnh, triệu chứng, thuốc (tên, liều, tần suất), thủ thuật và giải phẫu, rồi chuyển văn bản tự do thành dữ liệu có cấu trúc để phân tích hoặc lưu trữ.

Dịch vụ này nhận diện **PHI (Protected Health Information)** để ẩn danh hóa dữ liệu trước khi dùng hoặc chia sẻ, phù hợp ngữ cảnh tuân thủ **HIPAA**. Nó còn liên kết thực thể với mã chuẩn y tế: **ICD-10-CM** cho bệnh và **RxNorm** cho thuốc.

### 3.1. Pipeline y tế hay gặp

Comprehend Medical chỉ đọc văn bản, nên đề thường ghép nó với một dịch vụ đứng trước. Giọng nói của bác sĩ đi qua **Transcribe Medical** để thành chữ rồi mới vào Comprehend Medical. Bệnh án scan hoặc PDF đi qua **Textract** để lấy chữ rồi mới vào Comprehend Medical để hiểu nội dung y khoa.

> **Pattern đề thi:** *Bệnh viện có hồ sơ bệnh án dạng PDF scan, cần trích tên thuốc, liều dùng và ẩn thông tin cá nhân của bệnh nhân* => **Textract đọc chữ => Comprehend Medical trích thực thể và phát hiện PHI**.

## 4. Nhận diện nhanh các dịch vụ AI hay làm đáp án nhiễu

| Dịch vụ | Đầu vào => đầu ra |
|---------|-------------------|
| **Comprehend** | Văn bản thường => cảm xúc, thực thể, cụm từ khóa, ngôn ngữ (NLP tổng quát) |
| **Textract** | Tài liệu scan, PDF, form => chữ, bảng, cặp trường-giá trị có cấu trúc |
| **Transcribe** | Giọng nói => chữ (có bản Transcribe Medical cho y tế) |
| **Translate** | Văn bản ngôn ngữ này => văn bản ngôn ngữ khác |
| **Polly** | Chữ => giọng nói |
| **Lex** | Hội thoại => chatbot giọng nói hoặc chữ (công nghệ của Alexa) |
| **Kendra** | Câu hỏi ngôn ngữ tự nhiên => tìm kiếm thông minh trong kho tài liệu doanh nghiệp |
| **SageMaker** | Dữ liệu của bạn => tự xây, huấn luyện và triển khai mô hình ML riêng |

> **Pattern đề thi:** *Trích số tiền và các trường từ hàng nghìn hóa đơn PDF scan* => **Textract**, không phải Rekognition dù hóa đơn cũng là ảnh.

## 5. Kịch bản thi

1. Nhận diện vật thể hoặc khuôn mặt trong ảnh và video. => Rekognition.
2. Tự động lọc ảnh, video không phù hợp do người dùng tải lên. => Rekognition content moderation.
3. Phát hiện công nhân không đeo đồ bảo hộ trên công trường. => Rekognition PPE detection.
4. Phân tích video thời gian thực từ camera. => Kinesis Video Streams kết hợp Rekognition.
5. Trích bệnh, thuốc, triệu chứng từ ghi chú bác sĩ. => Comprehend Medical.
6. Phát hiện và ẩn danh PHI trong hồ sơ y tế theo HIPAA. => Comprehend Medical.
7. Chuyển ghi âm khám bệnh thành văn bản rồi trích thông tin y khoa. => Transcribe Medical => Comprehend Medical.
8. Phân tích cảm xúc đánh giá sản phẩm của khách hàng. => Comprehend, không phải Comprehend Medical.

## 6. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Đọc chữ trong ảnh đời thường (biển báo, biển số) | **Rekognition** | Textract |
| Trích chữ, bảng, form từ tài liệu scan hoặc PDF | **Textract** | Rekognition |
| Phân tích văn bản tổng quát (cảm xúc, thực thể) | **Comprehend** | Comprehend Medical |
| Trích thực thể y khoa, gán mã ICD-10 hoặc RxNorm | **Comprehend Medical** | Comprehend thường |
| Chuyển giọng nói y tế thành văn bản | **Transcribe Medical** | Comprehend Medical (chỉ đọc chữ) |
| Đọc bệnh án scan trước khi phân tích | **Textract => Comprehend Medical** | Chỉ dùng Comprehend Medical |
| Phân tích video dài | **Rekognition bất đồng bộ, SNS báo kết quả** | Gọi API đồng bộ như ảnh |
| Xử lý ảnh tải lên theo kiểu serverless | **S3 event => Lambda => Rekognition** | EC2 chạy mô hình tự dựng |
| Cần mô hình riêng, huấn luyện trên dữ liệu của mình | **SageMaker** | Dịch vụ AI dựng sẵn |

## 7. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Rekognition vs Textract:** Rekognition phân tích ảnh và video, kể cả chữ trong ảnh đời thường. Textract trích chữ, bảng và form có cấu trúc từ tài liệu scan, PDF, hóa đơn, biểu mẫu.
- **Rekognition vs Comprehend:** Rekognition thuộc thị giác máy tính và làm việc với ảnh, video. Comprehend là NLP và làm việc với văn bản.
- **Rekognition vs Transcribe:** Transcribe chuyển âm thanh giọng nói thành chữ. Rekognition không xử lý âm thanh.
- **Comprehend Medical vs Comprehend:** Cả hai đều là NLP, nhưng Comprehend Medical chuyên y tế với thực thể y khoa, PHI, ICD-10-CM, RxNorm và HIPAA. Comprehend thường dành cho văn bản chung như cảm xúc, thực thể, cụm từ khóa, ngôn ngữ.
- **Comprehend Medical vs Textract:** Textract chỉ lấy chữ thô, bảng, form từ tài liệu mà không hiểu nghĩa y khoa. Comprehend Medical hiểu nội dung y khoa, nên hai dịch vụ thường nối tiếp nhau.
- **Comprehend Medical vs Transcribe Medical:** Transcribe Medical chuyển giọng nói y tế thành chữ. Comprehend Medical phân tích chữ y tế, và cũng thường nối tiếp nhau trong pipeline.
- **Dịch vụ AI dựng sẵn vs SageMaker:** Dịch vụ dựng sẵn chỉ cần gọi API cho bài toán phổ biến. SageMaker dành cho khi cần tự xây và huấn luyện mô hình riêng, tốn công hơn nhiều.

## 8. Câu nhớ nhanh trước khi thi

> **Chọn dịch vụ AI theo đầu vào: ảnh/video => Rekognition, tài liệu/form => Textract, văn bản => Comprehend, giọng nói => Transcribe, chữ ra giọng nói => Polly, dịch => Translate.**
>
> **Rekognition: vật thể, khuôn mặt, kiểm duyệt nội dung, chữ trong ảnh đời thường, PPE, face liveness.**
>
> **Pipeline ảnh: S3 => Lambda => Rekognition. Video thời gian thực => Kinesis Video Streams + Rekognition. Video dài => bất đồng bộ + SNS.**
>
> **Comprehend Medical: NLP văn bản y tế, trích bệnh/thuốc/triệu chứng, phát hiện PHI, mã ICD-10-CM và RxNorm, HIPAA.**
>
> **Pipeline y tế: Transcribe Medical hoặc Textract => Comprehend Medical. Văn bản không y tế => Comprehend thường.**

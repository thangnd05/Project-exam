# Tag được giao

- slug: d2-sqs
- Domain: Resilient Architectures (SAA-C03 Domain 2)
- Tên tag: Amazon-SQS (Simple Queue Service)
- Tài liệu (đọc toàn bộ): D:/WINDE-AWS-DATA/document/c03/2-Resilient Architectures/Amazon-SQS.md
- Câu đã có: SCRATCH/existing/d2-sqs.txt (nếu nhiều câu thì lướt để tránh trùng kịch bản)
- Trọng tâm: Standard vs FIFO (message group ID, deduplication, high throughput mode), visibility timeout, dead-letter queue + redrive, long polling, delay queue, retention, giới hạn 256 KB + extended client dùng S3, Lambda event source mapping (batch, partial batch response), scale ASG theo backlog, SNS fan-out → SQS, tách rời producer/consumer.

Viết 70 câu vào SCRATCH/out/d2-sqs-1.json … SCRATCH/out/d2-sqs-5.json, chạy validate đến khi OK, trả báo cáo ngắn.

# Tag được giao

- slug: d3-rds-read-replica
- Domain: High-Performing Architectures (SAA-C03 Domain 3)
- Tên tag: RDS-Read-Replica (Relational Database Service - Read Replica)
- Tài liệu (đọc toàn bộ): D:/WINDE-AWS-DATA/document/c03/2-Resilient Architectures/RDS-Multi-AZ-and-Read-Replicas.md
- Câu đã có: SCRATCH/existing/d3-rds-read-replica.txt (nếu nhiều câu thì lướt để tránh trùng kịch bản)
- Trọng tâm: GÓC NHÌN HIỆU NĂNG: offload read (reporting/analytics) sang read replica, async replication lag, cross-Region read replica cho người dùng xa, số lượng replica tối đa, application phải trỏ endpoint replica, Multi-AZ không dùng để scale read, RDS Proxy, ElastiCache, so sánh với Aurora replicas, storage type gp3/io2 cho RDS.

Viết 70 câu vào SCRATCH/out/d3-rds-read-replica-1.json … SCRATCH/out/d3-rds-read-replica-5.json, chạy validate đến khi OK, trả báo cáo ngắn.

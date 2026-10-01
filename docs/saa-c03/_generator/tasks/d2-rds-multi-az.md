# Tag được giao

- slug: d2-rds-multi-az
- Domain: Resilient Architectures (SAA-C03 Domain 2)
- Tên tag: RDS-Multi-AZ-and-Read-Replicas
- Tài liệu (đọc toàn bộ): D:/WINDE-AWS-DATA/document/c03/2-Resilient Architectures/RDS-Multi-AZ-and-Read-Replicas.md
- Câu đã có: SCRATCH/existing/d2-rds-multi-az.txt (nếu nhiều câu thì lướt để tránh trùng kịch bản)
- Trọng tâm: Multi-AZ DB instance (synchronous standby, không đọc được, failover DNS) vs Multi-AZ DB cluster (2 readable standby), read replica (async, cross-Region, promote cho DR), automated backup + PITR, snapshot cross-Region copy, RDS Proxy (failover nhanh, connection pooling), maintenance/patching, Blue/Green Deployments, storage autoscaling.

Viết 70 câu vào SCRATCH/out/d2-rds-multi-az-1.json … SCRATCH/out/d2-rds-multi-az-5.json, chạy validate đến khi OK, trả báo cáo ngắn.

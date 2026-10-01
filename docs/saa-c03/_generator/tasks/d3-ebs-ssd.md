# Tag được giao

- slug: d3-ebs-ssd
- Domain: High-Performing Architectures (SAA-C03 Domain 3)
- Tên tag: Amazon-EBS-SSD (Elastic Block Store - Solid State Drive)
- Tài liệu (đọc toàn bộ): D:/WINDE-AWS-DATA/document/c03/3-High-Performing Architectures/Amazon-EBS-SSD.md
- Câu đã có: SCRATCH/existing/d3-ebs-ssd.txt (nếu nhiều câu thì lướt để tránh trùng kịch bản)
- Trọng tâm: gp3 (IOPS/throughput tách rời) vs gp2 (burst theo dung lượng) vs io2 Block Express (sub-ms, Multi-Attach) vs st1/sc1 HDD, EBS-optimized và giới hạn băng thông instance, RAID 0, snapshot + Fast Snapshot Restore, initialization, Elastic Volumes đổi type không downtime, instance store cho IOPS cực cao tạm thời.

Viết 70 câu vào SCRATCH/out/d3-ebs-ssd-1.json … SCRATCH/out/d3-ebs-ssd-5.json, chạy validate đến khi OK, trả báo cáo ngắn.

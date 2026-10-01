# Tag được giao

- slug: d2-elb
- Domain: Resilient Architectures (SAA-C03 Domain 2)
- Tên tag: ELB (Application / Network Load Balancer)
- Tài liệu (đọc toàn bộ): D:/Project-exam/docs/saa-c03/tai-lieu-tag-gop/2-Resilient Architectures/ELB-ALB-NLB.md
- Câu đã có: SCRATCH/existing/d2-elb.txt (nếu nhiều câu thì lướt để tránh trùng kịch bản)
- Trọng tâm: ALB (layer 7, path/host/header routing, target Lambda/IP, authenticate Cognito/OIDC, sticky sessions, TLS termination + SNI, WAF), NLB (layer 4, static IP/Elastic IP mỗi AZ, preserve client IP, TCP/UDP/TLS, ultra-low latency, PrivateLink), Gateway Load Balancer, health checks + ASG ELB health check, cross-zone load balancing, deregistration delay, internal vs internet-facing. Chia đều ALB và NLB, nhiều câu phân biệt.

Viết 70 câu vào SCRATCH/out/d2-elb-1.json … SCRATCH/out/d2-elb-5.json, chạy validate đến khi OK, trả báo cáo ngắn.

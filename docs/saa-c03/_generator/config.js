// 51 tag SAA-C03 sau khi gộp (2026-09-30). old = tên tag cũ trong dump DB, docs = tài liệu tham khảo.
const NEW = 'D:/Project-exam/docs/saa-c03/tai-lieu-tag-gop';
const OLD = 'D:/WINDE-AWS-DATA/document/c03';
const D1 = 'Secure Architectures', D2 = 'Resilient Architectures', D3 = 'High-Performing Architectures', D4 = 'Cost-Optimized Architectures';
const d1 = `${OLD}/1-Secure Architectures`, d2 = `${OLD}/2-Resilient Architectures`, d3 = `${OLD}/3-High-Performing Architectures`, d4 = `${OLD}/4-Cost-Optimized Architectures`;
const n1 = `${NEW}/1-Secure Architectures`, n2 = `${NEW}/2-Resilient Architectures`, n3 = `${NEW}/3-High-Performing Architectures`, n4 = `${NEW}/4-Cost-Optimized Architectures`;

const TAGS = [
  // Domain 1
  { part: D1, slug: 'd1-iam-sts', name: 'IAM / AWS-STS (Identity and Access Management / Security Token Service)', old: ['IAM (Identity and Access Management)', 'AWS-STS (Security Token Service)'], docs: [`${n1}/IAM-STS.md`] },
  { part: D1, slug: 'd1-identity-center-directory', name: 'IAM-Identity-Center / AWS-Directory-Service (Federation and SSO)', old: ['IAM-Identity-Center (AWS Single Sign-On)', 'AWS-Directory-Service'], docs: [`${n1}/IAM-Identity-Center-Directory-Service.md`] },
  { part: D1, slug: 'd1-cognito', name: 'Amazon-Cognito', old: ['Amazon-Cognito'], docs: [`${d1}/Amazon-Cognito.md`] },
  { part: D1, slug: 'd1-kms-acm', name: 'AWS-KMS / ACM (Encryption Keys and Certificates)', old: ['AWS-KMS (Key Management Service)', 'ACM (Certificate Manager)'], docs: [`${n1}/AWS-KMS-ACM.md`] },
  { part: D1, slug: 'd1-secrets-manager', name: 'AWS-Secrets-Manager', old: ['AWS-Secrets-Manager'], docs: [`${d1}/AWS-Secrets-Manager.md`] },
  { part: D1, slug: 'd1-s3-encryption-policies', name: 'S3-Encryption-Policies', old: ['S3-Encryption-Policies'], docs: [`${d1}/S3-Encryption-Policies.md`] },
  { part: D1, slug: 'd1-vpc-traffic-control', name: 'VPC-Traffic-Control', old: ['VPC-Traffic-Control'], docs: [`${d1}/VPC-Traffic-Control.md`] },
  { part: D1, slug: 'd1-vpc-endpoint', name: 'VPC-Endpoint (Virtual Private Cloud Endpoint)', old: ['VPC-Endpoint (Virtual Private Cloud Endpoint)'], docs: [`${d1}/VPC-Endpoint.md`] },
  { part: D1, slug: 'd1-network-protection', name: 'AWS-Network-Protection', old: ['AWS-Network-Protection'], docs: [`${d1}/AWS-Network-Protection.md`] },
  { part: D1, slug: 'd1-audit-logging', name: 'AWS-Audit-Logging', old: ['AWS-Audit-Logging'], docs: [`${d1}/AWS-Audit-Logging.md`] },
  { part: D1, slug: 'd1-threat-detection', name: 'Threat-Detection (GuardDuty / Inspector / Macie / Security Hub)', old: ['AWS-GuardDuty (Threat Detection)', 'AWS-Inspector (Vulnerability Scanning)', 'Amazon-Macie (Data Discovery)', 'AWS-Security-Hub'], docs: [`${n1}/Threat-Detection.md`] },
  { part: D1, slug: 'd1-systems-manager', name: 'AWS-Systems-Manager', old: ['AWS-Systems-Manager'], docs: [`${d1}/AWS-Systems-Manager.md`] },
  // Domain 2
  { part: D2, slug: 'd2-cloudwatch', name: 'AWS-CloudWatch', old: ['AWS-CloudWatch'], docs: [`${d2}/AWS-CloudWatch.md`] },
  { part: D2, slug: 'd2-managed-compute', name: 'Managed-Compute', old: ['Managed-Compute'], docs: [`${d2}/Managed-Compute.md`] },
  { part: D2, slug: 'd2-elb', name: 'ELB (Application / Network Load Balancer)', old: ['ALB (Application-Load-Balancer)', 'NLB (Network Load Balancer)'], docs: [`${n2}/ELB-ALB-NLB.md`] },
  { part: D2, slug: 'd2-auto-scaling', name: 'AWS-Auto-Scaling', old: ['AWS-Auto-Scaling'], docs: [`${d2}/AWS-Auto-Scaling.md`] },
  { part: D2, slug: 'd2-route53', name: 'Amazon-Route-53', old: ['Amazon-Route-53'], docs: [`${d2}/Amazon-Route-53.md`] },
  { part: D2, slug: 'd2-s3', name: 'Amazon-S3 (Simple Storage Service)', old: ['Amazon-S3 (Simple Storage Service)'], docs: [`${d2}/Amazon S3.md`] },
  { part: D2, slug: 'd2-efs-fsx', name: 'Amazon-EFS / Amazon-FSx (Shared File Storage)', old: ['Amazon-EFS (Elastic File System)', 'Amazon-FSx (File System x)'], docs: [`${n2}/Amazon-EFS-FSx.md`] },
  { part: D2, slug: 'd2-backup', name: 'AWS-Backup', old: ['AWS-Backup'], docs: [`${d2}/AWS-Backup.md`] },
  { part: D2, slug: 'd2-rds-multi-az', name: 'RDS-Multi-AZ-and-Read-Replicas', old: ['RDS-Multi-AZ-and-Read-Replicas'], docs: [`${d2}/RDS-Multi-AZ-and-Read-Replicas.md`] },
  { part: D2, slug: 'd2-aurora', name: 'Amazon-Aurora', old: ['Amazon-Aurora'], docs: [`${d2}/Amazon-Aurora.md`] },
  { part: D2, slug: 'd2-dynamodb', name: 'AWS-DynamoDB', old: ['AWS-DynamoDB'], docs: [`${d2}/DynamoDB.md`] },
  { part: D2, slug: 'd2-elasticache', name: 'AWS-ElastiCache', old: ['AWS-ElastiCache'], docs: [`${d2}/ElastiCache.md`] },
  { part: D2, slug: 'd2-sqs', name: 'Amazon-SQS (Simple Queue Service)', old: ['Amazon-SQS (Simple Queue Service)'], docs: [`${d2}/Amazon-SQS.md`] },
  { part: D2, slug: 'd2-sns', name: 'Amazon-SNS (Simple Notification Service)', old: ['Amazon-SNS (Simple Notification Service)'], docs: [`${d2}/Amazon-SNS.md`] },
  { part: D2, slug: 'd2-eventbridge', name: 'Amazon-EventBridge', old: ['Amazon-EventBridge'], docs: [`${d2}/Amazon-EventBridge.md`] },
  { part: D2, slug: 'd2-dx-tgw', name: 'AWS-Direct-Connect / AWS-Transit-Gateway (Hybrid and Multi-VPC Networking)', old: ['AWS-Direct-Connect', 'AWS-Transit-Gateway'], docs: [`${n2}/AWS-Direct-Connect-Transit-Gateway.md`] },
  { part: D2, slug: 'd2-dr-strategies', name: 'AWS-DR-Strategies', old: ['AWS-DR-Strategies'], docs: [`${d2}/AWS-DR-Strategies.md`] },
  // Domain 3
  { part: D3, slug: 'd3-ec2-instance-selection', name: 'EC2-Instance-Selection (Instance Families / Graviton / Placement Groups / Accelerators)', old: ['Managed-Compute'], docs: [`${n3}/EC2-Instance-Selection.md`] },
  { part: D3, slug: 'd3-lambda', name: 'AWS-Lambda', old: ['AWS-Lambda'], docs: [`${d3}/AWS-Lambda.md`] },
  { part: D3, slug: 'd3-ebs-ssd', name: 'Amazon-EBS-SSD (Elastic Block Store - Solid State Drive)', old: ['Amazon-EBS-SSD (Elastic Block Store - Solid State Drive)'], docs: [`${d3}/Amazon-EBS-SSD.md`] },
  { part: D3, slug: 'd3-s3', name: 'Amazon-S3', old: ['Amazon-S3'], docs: [`${d2}/Amazon S3.md`] },
  { part: D3, slug: 'd3-efs', name: 'Amazon-EFS', old: ['Amazon-EFS'], docs: [`${d2}/Amazon-EFS.md`] },
  { part: D3, slug: 'd3-fsx', name: 'Amazon-FSx (File System x)', old: ['Amazon-FSx (File System x)'], docs: [`${d2}/Amazon-FSx.md`] },
  { part: D3, slug: 'd3-aurora', name: 'Amazon-Aurora', old: ['Amazon-Aurora'], docs: [`${d2}/Amazon-Aurora.md`] },
  { part: D3, slug: 'd3-rds-read-replica', name: 'RDS-Read-Replica (Relational Database Service - Read Replica)', old: ['RDS-Read-Replica (Relational Database Service - Read Replica)'], docs: [`${d2}/RDS-Multi-AZ-and-Read-Replicas.md`] },
  { part: D3, slug: 'd3-dynamodb', name: 'Amazon-DynamoDB', old: ['Amazon-DynamoDB'], docs: [`${d2}/DynamoDB.md`] },
  { part: D3, slug: 'd3-elasticache', name: 'Amazon-ElastiCache', old: ['Amazon-ElastiCache'], docs: [`${d2}/ElastiCache.md`] },
  { part: D3, slug: 'd3-cloudfront', name: 'Amazon-CloudFront', old: ['Amazon-CloudFront'], docs: [`${d3}/Amazon-CloudFront.md`] },
  { part: D3, slug: 'd3-global-accelerator', name: 'AWS-Global-Accelerator', old: ['AWS-Global-Accelerator'], docs: [`${d3}/AWS-Global-Accelerator.md`] },
  { part: D3, slug: 'd3-api-gateway', name: 'Amazon-API-Gateway', old: ['Amazon-API-Gateway'], docs: [`${d3}/Amazon-API-Gateway.md`] },
  { part: D3, slug: 'd3-kinesis-firehose', name: 'Amazon-Kinesis / Amazon-Data-Firehose (Streaming)', old: ['Amazon-Kinesis', 'Amazon-Kinesis / Amazon-Data-Firehose'], docs: [`${n3}/Amazon-Kinesis-Data-Firehose.md`] },
  { part: D3, slug: 'd3-glue-athena', name: 'AWS-Glue / Amazon-Athena (Analytics)', old: ['AWS-Glue', 'Amazon-Athena'], docs: [`${n3}/AWS-Glue-Amazon-Athena.md`] },
  { part: D3, slug: 'd3-ai-ml', name: 'AI-ML-Services (Rekognition / Comprehend Medical)', old: ['Amazon-Rekognition', 'Amazon-Comprehend-Medical'], docs: [`${n3}/AI-ML-Services.md`] },
  // Domain 4
  { part: D4, slug: 'd4-compute-optimizer', name: 'AWS-Compute-Optimizer', old: ['AWS-Compute-Optimizer'], docs: [`${d4}/AWS-Compute-Optimizer.md`] },
  { part: D4, slug: 'd4-dynamodb', name: 'Amazon-DynamoDB', old: ['Amazon-DynamoDB'], docs: [`${d2}/DynamoDB.md`] },
  { part: D4, slug: 'd4-s3-storage-classes', name: 'S3-Storage-Classes-and-Lifecycle (Intelligent-Tiering / Glacier)', old: ['Amazon-S3', 'S3-Lifecycle-Policy (Simple Storage Service)', 'S3-Intelligent-Tiering', 'S3-Glacier'], docs: [`${n4}/S3-Storage-Classes-and-Lifecycle.md`] },
  { part: D4, slug: 'd4-ec2-purchasing', name: 'EC2-Purchasing-Options (Reserved / Savings Plans / Spot / Capacity Reservation)', old: ['Reserved-Instances / Savings-Plans', 'EC2-Spot-Instances (Elastic Compute Cloud)', 'On-Demand-Capacity-Reservation'], docs: [`${n4}/EC2-Purchasing-Options.md`] },
  { part: D4, slug: 'd4-cost-visibility', name: 'Cost-Visibility-and-Governance (Cost Explorer / Budgets / Allocation Tags / FinOps)', old: ['AWS-Cost-Explorer', 'AWS-Budgets', 'Cost-Allocation-Tags', 'FinOps-Strategy'], docs: [`${n4}/Cost-Visibility-and-Governance.md`] },
  { part: D4, slug: 'd4-network-costs', name: 'Network-Costs (Data Transfer / VPC Endpoint)', old: ['Data-Transfer-Costs', 'VPC-Endpoint (Virtual Private Cloud Endpoint)'], docs: [`${n4}/Network-Costs.md`] },
];
module.exports = { TAGS };

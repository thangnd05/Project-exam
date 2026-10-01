// Các tag DOP-C02 cần thêm 50 câu cho bản "-2". Tên tag khớp tagNames trong domain-*.json.
const R = 'Resilient Cloud Solutions';
const S = 'Security and Compliance';
const I = 'Incident and Event Response';
const TAGS = [
  { slug: 'd4-backup', part: R, name: 'AWS Backup' },
  { slug: 'd4-fis', part: R, name: 'AWS Fault Injection Service (FIS)' },
  { slug: 'd4-ecs-eks', part: R, name: 'Amazon ECS / EKS' },
  { slug: 'd4-db-ha', part: R, name: 'Database HA & Replication' },
  { slug: 'd4-elb', part: R, name: 'Elastic Load Balancing & Health Checks' },
  { slug: 'd4-multi-region-dr', part: R, name: 'Multi-Region DR Strategies' },
  { slug: 'd4-route53', part: R, name: 'Route 53 Routing Policies' },
  { slug: 'd5-artifact', part: S, name: 'AWS Artifact' },
  { slug: 'd5-config', part: S, name: 'AWS Config' },
  { slug: 'd5-control-tower', part: S, name: 'AWS Control Tower' },
  { slug: 'd5-iam', part: S, name: 'AWS IAM' },
  { slug: 'd5-kms', part: S, name: 'AWS KMS & Encryption' },
  { slug: 'd5-organizations', part: S, name: 'AWS Organizations' },
  { slug: 'd5-secrets', part: S, name: 'AWS Secrets Manager & Parameter Store' },
  { slug: 'd5-guardduty-inspector', part: S, name: 'Amazon GuardDuty & Amazon Inspector' },
  { slug: 'd6-lambda', part: I, name: 'AWS Lambda' },
  { slug: 'd6-step-functions', part: I, name: 'AWS Step Functions' },
  { slug: 'd6-eventbridge', part: I, name: 'Amazon EventBridge' },
  { slug: 'd6-remediation', part: I, name: 'Event-Driven Remediation (Config Remediation / SSM Automation)' },
  { slug: 'd6-incident-tooling', part: I, name: 'Incident Response Tooling (Security Hub / AWS Health / Incident Manager)' },
  { slug: 'd6-troubleshooting', part: I, name: 'Troubleshooting & Root Cause Analysis' },
];
module.exports = { TAGS };

// Hãng chứng chỉ hiển thị ở trang chủ; logo nằm trong public/images/providers.
// available = đã có ngân hàng đề, hãng còn lại dẫn sang trang Coming soon.
export const PROVIDERS = [
  { slug: 'aws', file: 'Amazon_Web_Services_Logo', name: 'Amazon Web Services', size: 'md', available: true },
  { slug: 'azure', file: 'Microsoft_Azure_Logo', name: 'Microsoft Azure', size: 'md', available: false },
  { slug: 'gcp', file: 'GCP_Logo', name: 'Google Cloud Platform', size: 'lg', available: false },
  { slug: 'oracle', file: 'Oracle_Logo', name: 'Oracle Cloud', size: 'sm', available: false },
  { slug: 'lpi', file: 'LPI_Logo', name: 'Linux Professional Institute', size: 'md', available: false },
] as const;

export type Provider = (typeof PROVIDERS)[number];

export const findProvider = (slug: string | null | undefined): Provider | undefined =>
  PROVIDERS.find((p) => p.slug === slug);

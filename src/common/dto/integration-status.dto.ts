export interface IntegrationStatusDto {
  available: boolean;
  baseUrl: string;
  checkedAt: string;
  reason?:
    | 'healthy'
    | 'timeout'
    | 'network_error'
    | 'http_error'
    | 'unknown_error';
  statusCode?: number;
}

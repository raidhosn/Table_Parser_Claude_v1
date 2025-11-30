/**
 * Internal request type codes used for language-agnostic logic.
 * These codes must never be used for display - only for conditional logic.
 */
export type RequestTypeCode =
    | 'ZONAL_ENABLEMENT'
    | 'REGIONAL_ENABLEMENT'
    | 'QUOTA_INCREASE'
    | 'REGION_ENABLEMENT_QUOTA_INCREASE'
    | 'REGION_LIMIT_INCREASE'
    | 'QUOTA_DECREASE'
    | 'RESERVED_INSTANCES'
    | 'UNKNOWN';

export interface TransformedRow {
    'Subscription ID': string;
    'Request Type': string;
    'VM Type': string;
    'Region': string;
    'Zone': string;
    'Cores': string;
    'Status': string;
    'Original ID'?: string;
    requestTypeCode: RequestTypeCode;
    [key: string]: any;
}

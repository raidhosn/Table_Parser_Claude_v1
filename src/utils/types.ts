export interface TransformedRow {
    'Subscription ID': string;
    'Request Type': string;
    'VM Type': string;
    'Region': string;
    'Zone': string;
    'Cores': string;
    'Status': string;
    'Original ID'?: string;
    requestTypeCode?: string;
    [key: string]: any;
}

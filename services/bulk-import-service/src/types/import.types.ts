export interface ImportError {
    row: number;
    error: string;
    data: any;
}

export interface ParsedRow {
    [key: string]: any;
}
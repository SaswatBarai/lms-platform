import * as fastcsv from "fast-csv";
import { Readable } from "stream";

export class ParserService {
    static async parseFileBuffer(buffer: Buffer, fileName: string): Promise<any[]> {
        const fileExtension = fileName.toLowerCase().split('.').pop();
        
        if (fileExtension === 'json') {
            try {
                const parsed = JSON.parse(buffer.toString());
                return Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [];
            } catch (error) {
                throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            // CSV parsing
            return new Promise((resolve, reject) => {
                const results: any[] = [];
                const stream = Readable.from(buffer);
                
                stream
                    .pipe(fastcsv.parse({ headers: true }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (error) => reject(error));
            });
        }
    }
}


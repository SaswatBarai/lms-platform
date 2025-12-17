import { Readable } from "stream";

export const parseJsonStream = async (stream: Readable): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        let data = '';
        
        stream
            .on('data', (chunk) => {
                data += chunk.toString();
            })
            .on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Support both array and object with array property
                    const results = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [];
                    resolve(results);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            })
            .on('error', (error) => reject(error));
    });
};


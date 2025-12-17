import csv from "csv-parser";
import { Readable } from "stream";

export const parseCsvStream = (stream: Readable): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        stream
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
};
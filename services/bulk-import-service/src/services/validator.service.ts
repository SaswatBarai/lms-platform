import { ZodSchema } from "zod";
import { ImportError } from "../types/import.types";

export class ValidatorService {
    static validateRow(row: any, index: number, schema: ZodSchema): { valid: boolean; error?: ImportError } {
        const result = schema.safeParse(row);
        
        if (!result.success) {
            const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return {
                valid: false,
                error: {
                    row: index + 1, // 1-based index for user friendliness
                    error: errorMessage,
                    data: row
                }
            };
        }

        return { valid: true };
    }
}
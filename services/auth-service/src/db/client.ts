import {Pool} from "pg"
import {drizzle} from "drizzle-orm/postgres-js"
import env from "../config/env.js"


const pool = new Pool({
    connectionString: env.POST_DB
})

export const db = drizzle(pool);

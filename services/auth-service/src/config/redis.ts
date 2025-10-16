import { Redis } from "ioredis";
import env from "./env.js"

const redisUrl = env.REDIS_URL;
const redisClient = new Redis(redisUrl);

export default redisClient;


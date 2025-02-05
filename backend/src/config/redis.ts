import {Redis} from "ioredis"
import {config} from "dotenv"

config()

// const redisClient = () => {
//     if (process.env.REDIS_URI) {
//         console.log(`Redis connected`)
//         return process.env.REDIS_URI
//     }
//     throw new Error('Redis connection failed')
// }

export const redis = new Redis(process.env.REDIS_URI as string)

redis.on('connect', () => console.log('Redis connected'))

redis.on('error', (error) => console.log('Redis connection error', error))
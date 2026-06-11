import { redis } from "../config/redis.js";
import { RATE_LIMIT_MAX, MAX_REQUESTS } from "../utils/constants.js";

export const rateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `ratelimit:${ip}`;

    const requests = await redis.incr(key);

    if (requests === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    if (requests > MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter Redis error:", error);
    next();
  }
};

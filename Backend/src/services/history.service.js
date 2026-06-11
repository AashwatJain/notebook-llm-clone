import { redis } from "../config/redis.js";

export const saveMessage = async (sessionId, role, content) => {
  const message = JSON.stringify({ role, content, timestamp: Date.now() });

  await redis.rpush(`chat:${sessionId}`, message);
  await redis.ltrim(`chat:${sessionId}`, -20, -1);
  await redis.expire(`chat:${sessionId}`, 86400);
};

export const getHistory = async (sessionId) => {
  let res = await redis.lrange(`chat:${sessionId}`, 0, -1);
  for (let i = 0; i < res.length; i++) {
    res[i] = JSON.parse(res[i]);
  }
  return res;
};

export const deleteHistory = async (sessionId) => {
  await redis.del(`chat:${sessionId}`);
};
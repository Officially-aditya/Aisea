import { Redis } from "@upstash/redis";

type RateLimitOptions = {
  limit: number;
  windowInSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const inMemoryBuckets = new Map<string, { count: number; resetAt: number }>();
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  redisClient = REDIS_URL && REDIS_TOKEN
    ? new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      })
    : null;

  return redisClient;
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cloudflareIp = request.headers.get("cf-connecting-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || cloudflareIp || "anonymous";
}

async function rateLimitWithRedis(
  namespace: string,
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error("Redis is not configured.");
  }

  const bucketKey = `sea:ratelimit:${namespace}:${identifier}`;
  const now = Date.now();
  const resetAt = now + options.windowInSeconds * 1000;
  const count = await redis.incr(bucketKey);

  if (count === 1) {
    await redis.expire(bucketKey, options.windowInSeconds);
  }

  const ttl = await redis.ttl(bucketKey);
  const ttlSeconds = ttl > 0 ? ttl : options.windowInSeconds;
  const computedResetAt = now + ttlSeconds * 1000;
  const remaining = Math.max(0, options.limit - count);

  return {
    allowed: count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt: count === 1 ? resetAt : computedResetAt,
    retryAfter: ttlSeconds,
  };
}

function rateLimitInMemory(
  namespace: string,
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const bucketKey = `${namespace}:${identifier}`;
  const now = Date.now();
  const existing = inMemoryBuckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowInSeconds * 1000;
    inMemoryBuckets.set(bucketKey, { count: 1, resetAt });

    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAt,
      retryAfter: options.windowInSeconds,
    };
  }

  existing.count += 1;
  inMemoryBuckets.set(bucketKey, existing);

  return {
    allowed: existing.count <= options.limit,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export async function applyRateLimit(
  request: Request,
  namespace: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request);

  try {
    if (getRedisClient()) {
      return await rateLimitWithRedis(namespace, identifier, options);
    }
  } catch {
    return rateLimitInMemory(namespace, identifier, options);
  }

  return rateLimitInMemory(namespace, identifier, options);
}

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": String(result.retryAfter),
  };
}
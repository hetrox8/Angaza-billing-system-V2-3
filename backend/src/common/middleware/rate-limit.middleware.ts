import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs: number = 60 * 1000; // 1 minute
  private readonly maxRequests: number = 100; // 100 requests per minute per IP

  use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req);
    const now = Date.now();

    const record = rateLimitStore.get(ip);

    if (!record || now - record.timestamp > this.windowMs) {
      // New window
      rateLimitStore.set(ip, { count: 1, timestamp: now });
      return next();
    }

    // Existing window
    if (record.count >= this.maxRequests) {
      const retryAfter = Math.ceil((this.windowMs - (now - record.timestamp)) / 1000);
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(now / 1000) + retryAfter);
      res.setHeader('Retry-After', retryAfter);
      
      throw new HttpException(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    record.count++;
    rateLimitStore.set(ip, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', this.maxRequests - record.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(now / 1000) + Math.ceil(this.windowMs / 1000));

    next();
  }

  private getClientIp(req: Request): string {
    // Check headers for forwarded IP (if behind proxy)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}

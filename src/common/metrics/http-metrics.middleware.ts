import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
  normalizeRoute,
  statusClass,
} from './http-metrics';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
      const route = normalizeRoute(req.baseUrl ? `${req.baseUrl}${req.path}` : req.path);
      const statusCode = res.statusCode;
      const labels = {
        method: req.method,
        route,
        status_class: statusClass(statusCode),
        status_code: String(statusCode),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, durationSeconds);
    });

    next();
  }
}

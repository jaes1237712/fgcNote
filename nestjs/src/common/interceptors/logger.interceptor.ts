import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap, catchError } from 'rxjs/operators';
  
  @Injectable()
  export class LoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggerInterceptor.name);
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const now = Date.now();
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest();
      const response = httpContext.getResponse(); // 可以獲取響應對象，但響應內容在 tap 中獲取
      const ip = request.ip || request.connection.remoteAddress;
  
      // 獲取控制器和處理器名稱
      const className = context.getClass().name;
      const handlerName = context.getHandler().name;
  
      // --- 請求資訊 ---
      this.logger.log(
        `[${className}.${handlerName}] Incoming Request:`,
        `URL: ${request.url}`,
        `IP: ${ip}`,
      );
  
      return next.handle().pipe(
        tap((data) => {
          // --- 響應成功資訊 ---
          const duration = Date.now() - now;
          this.logger.log(
            `[${className}.${handlerName}] Outgoing Response:`,
            `Method: ${request.method}`,
            `URL: ${request.url}`,
            `Status: ${response.statusCode}`,
            `Duration: ${duration}ms`,
            // `Response Body: ${JSON.stringify(data)}`, // 注意：響應內容也可能很大或包含敏感信息
          );
        }),
        catchError((error) => {
          // --- 響應錯誤資訊 ---
          const duration = Date.now() - now;
          this.logger.error(
            `[${className}.${handlerName}] Request Error:`,
            `Method: ${request.method}`,
            `URL: ${request.url}`,
            `Status: ${error.status || 500}`,
            `Duration: ${duration}ms`,
            `Error Message: ${error.message}`,
            `Stack: ${error.stack}`,
          );
          throw error; // 重新拋出錯誤以便 NestJS 的異常過濾器處理
        }),
      );
    }
  }
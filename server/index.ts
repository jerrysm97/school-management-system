import { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { app, log } from "./app";

const PORT = 5001;
const httpServer = createServer(app);

(async () => {
  await registerRoutes(httpServer, app);

  // Redacts sensitive fields from req.body before logging.
  // SECURITY: Never log passwords, tokens, or secret values in plaintext.
  function sanitizeBody(body: Record<string, any> | undefined): Record<string, any> {
    if (!body || typeof body !== 'object') return {};
    const REDACTED_KEYS = ['password', 'currentPassword', 'newPassword', 'token', 'idToken'];
    const sanitized = { ...body };
    for (const key of REDACTED_KEYS) {
      if (key in sanitized) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const isProduction = process.env.NODE_ENV === 'production';

    // Log with sanitized body — never log raw passwords or tokens.
    console.error("Server Error:", JSON.stringify({
      message,
      path: _req.path,
      method: _req.method,
      body: sanitizeBody(_req.body),
      user: (_req as any).user?.username ?? 'anonymous',
      // Stack traces are useful for debugging but not needed in production logs
      ...(isProduction ? {} : { stack: err.stack }),
    }, null, 2));

    if (res.headersSent) {
      return next(err);
    }

    // SECURITY: In production, never expose stack traces or internal error details to clients.
    if (isProduction) {
      // Generic message for 500s prevents internal info leakage.
      return res.status(status).json({ message: status === 500 ? "Internal Server Error" : message });
    }

    // In development: include full details to aid debugging.
    return res.status(status).json({ message, stack: err.stack, details: err.toString() });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5001", 10);
  httpServer.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
})();
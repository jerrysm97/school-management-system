import { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { app, log } from "./app";

const PORT = 5001;
const httpServer = createServer(app);

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Enhanced Logging
    const errorDetails = {
      message: message,
      stack: err.stack,
      path: _req.path,
      method: _req.method,
      body: _req.body,
      user: (_req as any).user ? (_req as any).user.username : 'anonymous'
    };

    console.error("Industrial Error Log:", JSON.stringify(errorDetails, null, 2));

    if (res.headersSent) {
      return next(err);
    }

    // In production, don't leak stack traces (TEMPORARILY ENABLED FOR DEBUGGING)
    const response = { message, stack: err.stack, details: err.toString() };

    return res.status(status).json(response);
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
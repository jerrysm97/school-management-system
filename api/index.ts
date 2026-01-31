import { app } from "../server/app";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

// Initialize app once
const httpServer = createServer(app);
const initialized = registerRoutes(httpServer, app);

export default async (req: any, res: any) => {
    await initialized;
    app(req, res);
};

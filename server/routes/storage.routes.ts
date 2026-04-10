import type { Express, Request, Response } from "express";
import { uploadFile, getSignedUrl, getPublicUrl, deleteFile } from "../supabase";

/**
 * Supabase Storage Routes
 * 
 * POST   /api/storage/upload          — Upload a file (multipart/form-data or base64 JSON)
 * GET    /api/storage/signed/:bucket/*path — Get a signed URL for private file access
 * GET    /api/storage/public/:bucket/*path — Get public URL
 * DELETE /api/storage/:bucket/*path   — Delete a file
 */
export function registerStorageRoutes(app: Express) {
  // ========================================
  // UPLOAD
  // ========================================
  app.post("/api/storage/upload", async (req: Request, res: Response) => {
    try {
      const { path, base64, contentType, bucket } = req.body;

      if (!path || !base64 || !contentType) {
        return res.status(400).json({ error: "Missing required fields: path, base64, contentType" });
      }

      const buffer = Buffer.from(base64, "base64");
      const result = await uploadFile(path, buffer, contentType, bucket);

      res.json({ success: true, url: result.url, path: result.path });
    } catch (err: any) {
      console.error("Storage upload error:", err);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  // ========================================
  // SIGNED URL (for private files)
  // ========================================
  app.get("/api/storage/signed/:bucket/*filePath", async (req: Request, res: Response) => {
    try {
      const bucket = req.params.bucket as string;
      const filePath = req.params.filePath as string;
      const expires = Number((req.query.expires as string) || '3600');

      const url = await getSignedUrl(filePath, expires, bucket);
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========================================
  // PUBLIC URL
  // ========================================
  app.get("/api/storage/public/:bucket/*filePath", (req: Request, res: Response) => {
    try {
      const bucket = req.params.bucket as string;
      const filePath = req.params.filePath as string;
      const url = getPublicUrl(filePath, bucket);
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========================================
  // DELETE
  // ========================================
  app.delete("/api/storage/:bucket/*filePath", async (req: Request, res: Response) => {
    try {
      const bucket = req.params.bucket as string;
      const filePath = req.params.filePath as string;

      await deleteFile(filePath, bucket);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========================================
  // LIST BUCKETS (admin only)
  // ========================================
  app.get("/api/storage/buckets", async (_req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../supabase");
      const { data, error } = await supabaseAdmin.storage.listBuckets();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

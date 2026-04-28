import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/upload", async (request, response) => {
    try {
      const { handleUpload } = await import('@vercel/blob/client');
      const jsonResponse = await handleUpload({
        body: request.body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          // Generate a client token for the browser to upload the file
          // ⚠️ Authenticate and authorize users before generating the token.
          // Otherwise, you're allowing anonymous uploads.
          return {
            allowedContentTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'application/pdf',
              'text/plain',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            tokenPayload: JSON.stringify({
              // optional, sent to onUploadCompleted
            }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          // Get notified of client upload completion
          // ⚠️ This will not work on localhost if you don't have a ngrok or localtunnel setup
          // However, it will work when deployed or if Vercel blob successfully hits your callback
          console.log('blob upload completed', blob, tokenPayload);
        },
      });

      return response.json(jsonResponse);
    } catch (error) {
      return response.status(400).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

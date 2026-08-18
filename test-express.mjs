import express from 'express';
import { handleUpload } from '@vercel/blob/client';

const app = express();
app.use(express.json());
app.post('/api/videos/upload-token', async (request, response) => {
  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      token: 'vercel_blob_rw_fake123_FAKETOKEN',
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['video/mp4'],
          tokenPayload: JSON.stringify({}),
        };
      },
    });
    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("ERROR:", error.message);
    return response.status(400).json({ error: error.message });
  }
});

const req = {
  body: { type: 'blob.generate-client-token', payload: { pathname: 'test.mp4' } },
  url: '/api/videos/upload-token',
  headers: {}
};
app.handle(req, {
  status: (s) => ({
    json: (data) => console.log("STATUS", s, "DATA", data)
  })
});

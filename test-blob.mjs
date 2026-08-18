import { handleUpload } from '@vercel/blob/client';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const request = {
      body: { type: 'upload/generate-token', payload: { pathname: 'test.mp4' } },
      url: '/api/videos/upload-token',
      headers: {}
    };
    
    await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['video/mp4'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {},
    });
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}
test();

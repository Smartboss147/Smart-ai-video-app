import { handleUpload } from '@vercel/blob/client';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const request = {
      body: { type: 'blob.generate-client-token', payload: { pathname: 'test.mp4' } },
      url: '/api/videos/upload-token',
      headers: {}
    };
    
    const json = await handleUpload({
      body: request.body,
      request,
      token: 'vercel_blob_rw_fake123_FAKETOKEN',
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['video/mp4'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {},
    });
    console.log("Success:", json);
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}
test();

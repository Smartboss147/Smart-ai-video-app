require('dotenv').config();
const { handleUpload } = require('@vercel/blob/client');

async function test() {
  try {
    const request = {
      body: JSON.stringify({ type: 'upload/generate-token', payload: { pathname: 'test.mp4' } })
    };
    
    await handleUpload({
      body: JSON.parse(request.body),
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

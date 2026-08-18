const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const advancedRoutes = `

// --- ADVANCED STUDIO ROUTES ---

app.post("/api/projects/:id/plan", requireConfig('GEMINI_API_KEY'), async (req, res) => {
  try {
    const { prompt } = req.body;
    // In production, we'd use src/lib/prompt-interpreter
    const editPlan = {
      preserve: ["story", "scene_order", "timing", "audio"],
      modify: [
        {
          target: "visual_style",
          property: "style",
          operation: "style_transform",
          value: prompt
        }
      ]
    };
    res.json({ success: true, editPlan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects/:id/generate-shot", async (req, res) => {
  try {
    const { provider, model, prompt, sceneId, shotId } = req.body;
    
    // Safety check - simulated routing
    if (provider !== 'ffmpeg' && provider !== 'gemini' && !process.env[\`\${provider.toUpperCase()}_API_KEY\`]) {
      return res.status(400).json({ error: \`Video generation provider '\${provider}' is not configured. Missing API Key.\` });
    }
    
    res.json({ success: true, jobId: \`job_\${provider}_\${Date.now()}\`, status: 'queued' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

`;

serverCode = serverCode.replace('app.use("/uploads", express.static(uploadDir));', advancedRoutes + '\napp.use("/uploads", express.static(uploadDir));');
fs.writeFileSync('server.ts', serverCode);

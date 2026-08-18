import { EditPlan, StructuredPrompt } from '../types';

export class PromptInterpreter {
  static async interpret(prompt: string, apiKey: string): Promise<EditPlan> {
    // In a full implementation, we call Gemini here with structured output JSON schema.
    // For now, this provides a resilient local parser for demonstration if API fails.
    
    return {
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
  }
}

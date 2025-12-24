import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

export const generateTasksFromDescription = async (description: string): Promise<Task[]> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate a list of 4-6 project management tasks based on this description: "${description}".
      Return a JSON array of objects.
      Each object should have:
      - title (string)
      - description (string, brief)
      - priority (one of: Low, Medium, High, Critical)
      - tags (array of strings, max 3)
      
      Assume the status is 'Todo' for all.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "priority"]
          }
        }
      }
    });

    const tasksData = JSON.parse(response.text || "[]");
    
    // Map to application Task type
    return tasksData.map((t: any) => ({
      id: crypto.randomUUID(),
      title: t.title,
      description: t.description || '',
      priority: t.priority as Priority,
      status: TaskStatus.TODO,
      tags: t.tags || [],
      subtasks: [],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString() // Default 3 days out
    }));
  } catch (error) {
    console.error("Error generating tasks:", error);
    return [];
  }
};

export const getAIInsights = async (tasks: Task[]): Promise<string> => {
  try {
    const taskSummary = tasks.map(t => `- ${t.title} (${t.status}, ${t.priority})`).join('\n');
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze these tasks and give a one-sentence strategic insight or productivity tip for the project manager. Be concise, professional, and encouraging.
      Tasks:
      ${taskSummary}`,
    });

    return response.text || "Keep up the momentum!";
  } catch (error) {
    console.error("Error getting insights:", error);
    return "Focus on high priority tasks to move the needle.";
  }
};
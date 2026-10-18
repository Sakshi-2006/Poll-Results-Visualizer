export type PollRow = {
  id: string;
  timestamp: string; // ISO date
  ageGroup: string;
  gender: string;
  region: string;
  preferredTool: string;
  satisfaction: number; // 1-5
  feedback: string;
};

export type PollSchema = {
  id: string;
  label: string;
  questions: PollQuestion[];
};

export type PollQuestion = {
  key: keyof PollRow | string;
  prompt: string;
  type: "categorical" | "rating" | "text";
  options?: string[];
};

export const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"];
export const GENDERS = ["Female", "Male", "Non-binary"];
export const REGIONS = ["North", "South", "East", "West", "Central"];
export const TOOLS = ["Python", "R", "Excel", "SQL", "Tableau", "Power BI"];

export const POLL_SCHEMA: PollSchema = {
  id: "datatool-poll",
  label: "Data Analyst Tool Preference Poll",
  questions: [
    {
      key: "preferredTool",
      prompt: "Which data tool do you prefer most?",
      type: "categorical",
      options: TOOLS,
    },
    {
      key: "satisfaction",
      prompt: "How satisfied are you with your current tool? (1-5)",
      type: "rating",
    },
    {
      key: "feedback",
      prompt: "Share any open-ended feedback",
      type: "text",
    },
  ],
};

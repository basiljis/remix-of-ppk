export interface TaskBlock {
  id: string;
  sphere_slug: string;
  title: string;
  description: string | null;
  estimated_duration_minutes: number;
}

export interface BlockTask {
  id: string;
  block_id: string;
  task_type: string;
  title: string;
  instruction: string;
  content: any;
  points: number;
}

export interface TaskProgress {
  id: string;
  child_id: string;
  block_id: string;
  task_id: string;
  status: string;
  answer: any;
  score: number | null;
  interaction_time_seconds: number | null;
}

export interface SphereConfig {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
}

export const sphereConfig: Record<string, SphereConfig> = {
  motor: { name: "Моторика", icon: null, color: "text-blue-600", bgColor: "bg-blue-100", textColor: "text-blue-900" },
  speech: { name: "Речь", icon: null, color: "text-green-600", bgColor: "bg-green-100", textColor: "text-green-900" },
  cognitive: { name: "Познание", icon: null, color: "text-purple-600", bgColor: "bg-purple-100", textColor: "text-purple-900" },
  social: { name: "Общение", icon: null, color: "text-orange-600", bgColor: "bg-orange-100", textColor: "text-orange-900" },
  emotional: { name: "Эмоции", icon: null, color: "text-pink-600", bgColor: "bg-pink-100", textColor: "text-pink-900" },
};

import { supabase } from "@/integrations/supabase/client";
import { BlogPost, postToZenHtml } from "@/types/blog";

export interface ZenSettings {
  token: string;
  channelId?: string;
}

export async function getZenSettings(): Promise<ZenSettings | null> {
  const { data, error } = await supabase
    .from("api_sessions")
    .select("token")
    .eq("service_name", "yandex_zen")
    .maybeSingle();

  if (error || !data) return null;
  
  try {
    return JSON.parse(data.token);
  } catch {
    return { token: data.token };
  }
}

export async function saveZenSettings(settings: ZenSettings) {
  const { error } = await supabase
    .from("api_sessions")
    .upsert({
      service_name: "yandex_zen",
      token: JSON.stringify(settings),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(), // 10 years
    }, { onConflict: 'service_name' });

  if (error) throw error;
}

export async function publishToZen(post: BlogPost, settings: ZenSettings) {
  // Yandex Zen API (typically part of Yandex.Publisher or via special partner API)
  // Since Zen API is not public for everyone (often requires RSS or manual partner access),
  // we implement a placeholder for the actual fetch call.
  // In a real production environment, this would call an Edge Function that talks to Zen.
  
  console.log("Publishing to Zen:", post.title, settings.channelId);
  
  // Example of what the call might look like:
  /*
  const response = await fetch("https://api.zen.yandex.ru/v1/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: post.title,
      content: postToZenHtml(post),
      // ... other fields
    })
  });
  */

  // For this project, we'll use a Supabase Edge Function to handle the actual API call 
  // to avoid CORS issues and keep secrets safe.
  
  const { data, error } = await supabase.functions.invoke("publish-to-zen", {
    body: { post, settings }
  });

  if (error) throw error;
  return data;
}

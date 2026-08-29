import { supabase } from './supabase';

export async function generateTopicPrompts(familyId: string, topic: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('generate-prompts', {
    body: { familyId, topic },
  });
  if (error) throw new Error(error.message);
  return data?.prompts ?? [];
}

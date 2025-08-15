import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProtocolChecklistItem {
  id: string;
  checklist_item_id: string;
  block: string;
  block_order: number;
  education_level_do: boolean;
  education_level_noo: boolean;
  education_level_oo: boolean;
  education_level_soo: boolean;
  topic: string;
  topic_order: number;
  subtopic: string;
  subtopic_order: number;
  description: string;
  score_0_label: string | null;
  score_1_label: string | null;
  weight: number;
  score?: 0 | 1; // User-selected score
}

export interface ProtocolChecklistBlock {
  id: string;
  title: string;
  order: number;
  topics: ProtocolChecklistTopic[];
}

export interface ProtocolChecklistTopic {
  id: string;
  title: string;
  order: number;
  subtopics: ProtocolChecklistSubtopic[];
}

export interface ProtocolChecklistSubtopic {
  id: string;
  title: string;
  order: number;
  items: ProtocolChecklistItem[];
}

export const useProtocolChecklistData = () => {
  const [items, setItems] = useState<ProtocolChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProtocolChecklistItems();
  }, []);

  const fetchProtocolChecklistItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('protocol_checklist_items')
        .select('*')
        .order('block_order')
        .order('topic_order')
        .order('subtopic_order');

      if (error) throw error;

      const transformedItems: ProtocolChecklistItem[] = (data || []).map(item => ({
        id: item.id,
        checklist_item_id: item.checklist_item_id,
        block: item.block,
        block_order: item.block_order,
        education_level_do: item.education_level_do,
        education_level_noo: item.education_level_noo,
        education_level_oo: item.education_level_oo,
        education_level_soo: item.education_level_soo,
        topic: item.topic,
        topic_order: item.topic_order,
        subtopic: item.subtopic,
        subtopic_order: item.subtopic_order,
        description: item.description,
        score_0_label: item.score_0_label,
        score_1_label: item.score_1_label,
        weight: item.weight,
        score: 0 // Default score
      }));

      setItems(transformedItems);
    } catch (err) {
      console.error('Error fetching protocol checklist items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getItemsByEducationLevel = (level: string): ProtocolChecklistItem[] => {
    const levelMap: Record<string, keyof Pick<ProtocolChecklistItem, 'education_level_do' | 'education_level_noo' | 'education_level_oo' | 'education_level_soo'>> = {
      'preschool': 'education_level_do',
      'elementary': 'education_level_noo',
      'middle': 'education_level_oo',
      'high': 'education_level_soo'
    };

    const levelKey = levelMap[level];
    if (!levelKey) return [];

    return items.filter(item => item[levelKey]);
  };

  const getBlocksForEducationLevel = (level: string): ProtocolChecklistBlock[] => {
    const levelItems = getItemsByEducationLevel(level);
    
    // Group by blocks
    const blocksMap = new Map<string, ProtocolChecklistBlock>();
    
    levelItems.forEach(item => {
      const blockKey = `${item.block_order}-${item.block}`;
      
      if (!blocksMap.has(blockKey)) {
        blocksMap.set(blockKey, {
          id: blockKey,
          title: item.block,
          order: item.block_order,
          topics: []
        });
      }
      
      const block = blocksMap.get(blockKey)!;
      
      // Group by topics
      let topic = block.topics.find(t => t.order === item.topic_order && t.title === item.topic);
      if (!topic) {
        topic = {
          id: `${item.topic_order}-${item.topic}`,
          title: item.topic,
          order: item.topic_order,
          subtopics: []
        };
        block.topics.push(topic);
      }
      
      // Group by subtopics
      let subtopic = topic.subtopics.find(s => s.order === item.subtopic_order && s.title === item.subtopic);
      if (!subtopic) {
        subtopic = {
          id: `${item.subtopic_order}-${item.subtopic}`,
          title: item.subtopic,
          order: item.subtopic_order,
          items: []
        };
        topic.subtopics.push(subtopic);
      }
      
      subtopic.items.push(item);
    });
    
    // Sort everything
    const blocks = Array.from(blocksMap.values()).sort((a, b) => a.order - b.order);
    blocks.forEach(block => {
      block.topics.sort((a, b) => a.order - b.order);
      block.topics.forEach(topic => {
        topic.subtopics.sort((a, b) => a.order - b.order);
        topic.subtopics.forEach(subtopic => {
          subtopic.items.sort((a, b) => a.subtopic_order - b.subtopic_order);
        });
      });
    });
    
    return blocks;
  };

  const updateItemScore = (itemId: string, score: 0 | 1) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.checklist_item_id === itemId ? { ...item, score } : item
      )
    );
  };

  const calculateBlockScore = (block: ProtocolChecklistBlock): { score: number; maxScore: number; percentage: number } => {
    let totalScore = 0;
    let maxScore = 0;

    block.topics.forEach(topic => {
      topic.subtopics.forEach(subtopic => {
        subtopic.items.forEach(item => {
          totalScore += (item.score || 0) * item.weight;
          maxScore += item.weight;
        });
      });
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    return { score: totalScore, maxScore, percentage };
  };

  return {
    items,
    loading,
    error,
    getItemsByEducationLevel,
    getBlocksForEducationLevel,
    updateItemScore,
    calculateBlockScore,
    refetch: fetchProtocolChecklistItems
  };
};
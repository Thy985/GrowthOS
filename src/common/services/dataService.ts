import { supabase } from '../utils/supabase';

// 成长树服务
export const growthTreeService = {
  async getTrees() {
    const { data, error } = await supabase
      .from('growth_trees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async createTree(name: string) {
    const { data, error } = await supabase
      .from('growth_trees')
      .insert({ name })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateTree(id: string, name: string) {
    const { data, error } = await supabase
      .from('growth_trees')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteTree(id: string) {
    const { error } = await supabase
      .from('growth_trees')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};

// 树节点服务
export const treeNodeService = {
  async getNodes(treeId: string) {
    const { data, error } = await supabase
      .from('tree_nodes')
      .select('*')
      .eq('tree_id', treeId)
      .order('last_updated', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async createNode(node: {
    tree_id: string;
    parent_id?: string;
    name: string;
    type: string;
    mastery?: number;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('tree_nodes')
      .insert(node)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateNode(id: string, updates: Partial<{
    name: string;
    type: string;
    mastery: number;
    status: string;
  }>) {
    const { data, error } = await supabase
      .from('tree_nodes')
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteNode(id: string) {
    const { error } = await supabase
      .from('tree_nodes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};

// 日常记录服务
export const recordService = {
  async getRecords() {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async getRecordById(id: string) {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*, record_items(*)')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async createRecord(record: {
    date: string;
    mood?: string;
    reflection?: string;
  }) {
    const { data, error } = await supabase
      .from('daily_records')
      .insert(record)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateRecord(id: string, updates: Partial<{
    mood: string;
    reflection: string;
  }>) {
    const { data, error } = await supabase
      .from('daily_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteRecord(id: string) {
    const { error } = await supabase
      .from('daily_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};

// 记录项目服务
export const recordItemService = {
  async createItem(item: {
    record_id: string;
    type: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from('record_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('record_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};

// 目标服务
export const goalService = {
  async getGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async createGoal(goal: {
    title: string;
    description?: string;
    target_value: number;
    start_date: string;
    end_date: string;
  }) {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateGoal(id: string, updates: Partial<{
    title: string;
    description: string;
    target_value: number;
    current_value: number;
    status: string;
  }>) {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};

// 提醒服务
export const reminderService = {
  async getReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  },

  async createReminder(reminder: {
    title: string;
    description?: string;
    date: string;
    time: string;
  }) {
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminder)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateReminder(id: string, updates: Partial<{
    title: string;
    description: string;
    date: string;
    time: string;
    is_completed: boolean;
  }>) {
    const { data, error } = await supabase
      .from('reminders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteReminder(id: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};

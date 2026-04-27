import { supabase } from '../utils/supabase';
import { secureStorage } from '../../utils/secureStorage';
import { v4 as uuidv4 } from 'uuid';

// 迁移服务
export const migrationService = {
  async checkMigrationStatus() {
    return secureStorage.getItem('growthos-migrated') === 'true';
  },

  async migrateData() {
    try {
      // 1. 检测本地数据
      const localData = {
        records: secureStorage.getItem('growthos-records') || [],
        tree: secureStorage.getItem('growthos-tree') || null,
        goals: secureStorage.getItem('growthos-goals') || [],
        reminders: secureStorage.getItem('growthos-reminders') || []
      };

      // 2. 迁移数据
      await Promise.all([
        this.migrateRecords(localData.records),
        this.migrateGrowthTree(localData.tree),
        this.migrateGoals(localData.goals),
        this.migrateReminders(localData.reminders)
      ]);

      // 3. 标记迁移完成
      secureStorage.setItem('growthos-migrated', 'true');
      return true;
    } catch (error) {
      console.error('数据迁移失败:', error);
      return false;
    }
  },

  async migrateRecords(records: any[]) {
    if (!records || records.length === 0) return;

    for (const record of records) {
      try {
        // 创建记录
        const { data: createdRecord, error: recordError } = await supabase
          .from('daily_records')
          .insert({
            date: record.date,
            mood: record.mood,
            reflection: record.reflection
          })
          .select()
          .single();

        if (recordError) {
          console.error('迁移记录失败:', recordError);
          continue;
        }

        // 迁移记录项目
        if (record.items && record.items.length > 0) {
          for (const item of record.items) {
            await supabase
              .from('record_items')
              .insert({
                record_id: createdRecord.id,
                type: item.type,
                content: item.content
              });
          }
        }
      } catch (error) {
        console.error('迁移记录失败:', error);
      }
    }
  },

  async migrateGrowthTree(tree: any) {
    if (!tree) return;

    try {
      // 创建成长树
      const { data: createdTree, error: treeError } = await supabase
        .from('growth_trees')
        .insert({
          name: tree.name || '默认成长树'
        })
        .select()
        .single();

      if (treeError) {
        console.error('迁移成长树失败:', treeError);
        return;
      }

      // 递归迁移节点
      if (tree.children && tree.children.length > 0) {
        await this.migrateTreeNodes(tree.children, createdTree.id);
      }
    } catch (error) {
      console.error('迁移成长树失败:', error);
    }
  },

  async migrateTreeNodes(nodes: any[], treeId: string, parentId?: string) {
    for (const node of nodes) {
      try {
        // 创建节点
        const { data: createdNode, error: nodeError } = await supabase
          .from('tree_nodes')
          .insert({
            tree_id: treeId,
            parent_id: parentId,
            name: node.name,
            type: node.type || 'skill',
            mastery: node.mastery || 0,
            status: node.status || 'not_started',
            start_date: node.startDate || new Date().toISOString(),
            last_updated: new Date().toISOString()
          })
          .select()
          .single();

        if (nodeError) {
          console.error('迁移树节点失败:', nodeError);
          continue;
        }

        // 递归迁移子节点
        if (node.children && node.children.length > 0) {
          await this.migrateTreeNodes(node.children, treeId, createdNode.id);
        }
      } catch (error) {
        console.error('迁移树节点失败:', error);
      }
    }
  },

  async migrateGoals(goals: any[]) {
    if (!goals || goals.length === 0) return;

    for (const goal of goals) {
      try {
        await supabase
          .from('goals')
          .insert({
            title: goal.title,
            description: goal.description,
            target_value: goal.targetValue || 0,
            current_value: goal.currentValue || 0,
            start_date: goal.startDate || new Date().toISOString().split('T')[0],
            end_date: goal.endDate || new Date().toISOString().split('T')[0],
            status: goal.status || 'active'
          });
      } catch (error) {
        console.error('迁移目标失败:', error);
      }
    }
  },

  async migrateReminders(reminders: any[]) {
    if (!reminders || reminders.length === 0) return;

    for (const reminder of reminders) {
      try {
        await supabase
          .from('reminders')
          .insert({
            title: reminder.title,
            description: reminder.description,
            date: reminder.date,
            time: reminder.time,
            is_completed: reminder.isCompleted || false
          });
      } catch (error) {
        console.error('迁移提醒失败:', error);
      }
    }
  },

  async clearLocalData() {
    try {
      secureStorage.removeItem('growthos-records');
      secureStorage.removeItem('growthos-tree');
      secureStorage.removeItem('growthos-goals');
      secureStorage.removeItem('growthos-reminders');
      return true;
    } catch (error) {
      console.error('清理本地数据失败:', error);
      return false;
    }
  }
};

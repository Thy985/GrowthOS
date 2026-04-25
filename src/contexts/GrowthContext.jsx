import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建Context
const GrowthContext = createContext();

// 自定义Hook，方便组件使用Context
export const useGrowth = () => {
  const context = useContext(GrowthContext);
  if (!context) {
    throw new Error('useGrowth must be used within a GrowthProvider');
  }
  return context;
};

// Provider组件
export const GrowthProvider = ({ children }) => {
  // 状态
  const [records, setRecords] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 从localStorage加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 加载记录
        const savedRecords = localStorage.getItem('growthos-records');
        if (savedRecords) {
          setRecords(JSON.parse(savedRecords));
        }

        // 加载成长树
        const savedTree = localStorage.getItem('growthos-tree');
        if (savedTree) {
          setTreeData(JSON.parse(savedTree));
        } else {
          // 初始化默认成长树
          const defaultTree = {
            id: '1',
            name: '成长树',
            children: [
              {
                id: '2',
                name: '技能树',
                type: 'skill',
                children: [
                  { id: '3', name: '编程', type: 'skill' },
                  { id: '4', name: '写作', type: 'skill' },
                  { id: '5', name: '外语', type: 'skill' }
                ]
              },
              {
                id: '6',
                name: '认知树',
                type: 'cognition',
                children: [
                  { id: '7', name: '阅读', type: 'cognition' },
                  { id: '8', name: '课程', type: 'cognition' },
                  { id: '9', name: '观影', type: 'cognition' }
                ]
              },
              {
                id: '10',
                name: '习惯树',
                type: 'habit',
                children: [
                  { id: '11', name: '运动', type: 'habit' },
                  { id: '12', name: '早起', type: 'habit' },
                  { id: '13', name: '冥想', type: 'habit' }
                ]
              },
              {
                id: '14',
                name: '生活树',
                type: 'life',
                children: [
                  { id: '15', name: '家庭', type: 'life' },
                  { id: '16', name: '社交', type: 'life' },
                  { id: '17', name: '旅行', type: 'life' }
                ]
              }
            ]
          };
          setTreeData(defaultTree);
          localStorage.setItem('growthos-tree', JSON.stringify(defaultTree));
        }
      } catch (err) {
        setError('加载数据失败');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 保存记录
  const addRecord = (record) => {
    const newRecord = {
      id: Date.now(),
      ...record,
      createdAt: new Date().toISOString(),
      tags: extractTags(record.activity + ' ' + record.learning)
    };
    
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('growthos-records', JSON.stringify(updatedRecords));
    
    // 自动处理标签，创建影子节点
    handleTags(newRecord.tags);
    
    return newRecord;
  };

  // 提取标签
  const extractTags = (text) => {
    // 提取显式标签（#tag）
    const tagRegex = /#([^\s]+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }
    
    // 自动提取隐式标签（基于关键词）
    const keywordTags = extractKeywordTags(text);
    return [...new Set([...tags, ...keywordTags])];
  };

  // 从文本中提取关键词作为标签
  const extractKeywordTags = (text) => {
    const keywordMap = {
      '编程': ['编程', '代码', '开发', 'coding', 'programming'],
      '写作': ['写作', '文章', '博客', '写', 'writing'],
      '外语': ['英语', '日语', '外语', '学习', 'language'],
      '阅读': ['阅读', '读书', '书', 'reading', 'book'],
      '运动': ['运动', '健身', '跑步', '锻炼', 'sports', 'exercise'],
      '早起': ['早起', '早睡', '起床', 'morning'],
      '冥想': ['冥想', '正念', '冥想练习', 'meditation'],
      '家庭': ['家庭', '家人', '亲子', 'family'],
      '社交': ['社交', '朋友', '聚会', 'social'],
      '旅行': ['旅行', '旅游', '出行', 'travel']
    };
    
    const extractedTags = [];
    Object.entries(keywordMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        extractedTags.push(tag);
      }
    });
    return extractedTags;
  };

  // 处理标签，创建影子节点
  const handleTags = (tags) => {
    if (!tags || tags.length === 0) return;
    if (!treeData) return;
    
    const updatedTree = JSON.parse(JSON.stringify(treeData));
    let hasChanges = false;
    
    tags.forEach(tag => {
      if (!isTagExists(updatedTree, tag)) {
        addShadowNode(updatedTree, tag);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      updateTree(updatedTree);
    }
  };

  // 检查标签是否已存在
  const isTagExists = (node, tag) => {
    if (node.name === tag) return true;
    if (node.children) {
      for (const child of node.children) {
        if (isTagExists(child, tag)) {
          return true;
        }
      }
    }
    return false;
  };

  // 添加影子节点
  const addShadowNode = (node, tag) => {
    // 找到合适的父节点
    const suitableParent = findSuitableParent(node, tag);
    if (suitableParent) {
      const newNode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: tag,
        type: 'shadow',
        children: []
      };
      suitableParent.children.push(newNode);
    }
  };

  // 找到合适的父节点
  const findSuitableParent = (node, tag) => {
    // 优先选择叶子节点作为父节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const result = findSuitableParent(child, tag);
        if (result) return result;
      }
    }
    // 如果是叶子节点且不是影子节点，返回它
    if (!node.children || node.children.length === 0) {
      return node.type !== 'shadow' ? node : null;
    }
    return null;
  };

  // 更新成长树
  const updateTree = (newTreeData) => {
    setTreeData(newTreeData);
    localStorage.setItem('growthos-tree', JSON.stringify(newTreeData));
  };

  // 添加树节点
  const addTreeNode = (node) => {
    if (!treeData) return;
    
    // 这里可以实现添加节点的逻辑
    console.log('添加节点:', node);
  };

  // 计算统计数据
  const getStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyRecords = records.filter(record => {
      return new Date(record.createdAt) >= weekAgo;
    }).length;
    
    const totalRecords = records.length;
    const growthProgress = Math.min(Math.round((totalRecords / 100) * 100), 100);
    
    return {
      weeklyRecords,
      totalRecords,
      growthProgress
    };
  };

  // 计算情绪平均值
  const getAverageMood = () => {
    if (records.length === 0) return 0;
    
    const totalMood = records.reduce((sum, record) => {
      switch (record.mood) {
        case '很好':
          return sum + 2;
        case '一般':
          return sum + 1;
        case '不太好':
          return sum + 0;
        default:
          return sum;
      }
    }, 0);
    
    return (totalMood / records.length).toFixed(1);
  };

  // 导出数据
  const exportData = () => {
    const exportData = {
      records,
      treeData,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `growthos-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 提供给子组件的值
  const value = {
    records,
    treeData,
    isLoading,
    error,
    addRecord,
    updateTree,
    addTreeNode,
    getStats,
    getAverageMood,
    exportData
  };

  return (
    <GrowthContext.Provider value={value}>
      {children}
    </GrowthContext.Provider>
  );
};

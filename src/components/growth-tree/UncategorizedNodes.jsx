import React from 'react';

const UncategorizedNodes = () => {
  // 模拟未分类节点数据
  const uncategorizedNodes = [
    { id: 1, name: '#Python', status: 'normal' },
    { id: 2, name: '#阅读', status: 'normal' },
    { id: 3, name: '#React', status: 'wilting' },
    { id: 4, name: '#跑步', status: 'wilting' },
    { id: 5, name: '#王者荣耀', status: 'wilted' }
  ];

  return (
    <div className="mt-6">
      <h3 className="font-medium mb-2">未分类节点（影子节点）</h3>
      <div className="space-y-2">
        {uncategorizedNodes.map(node => (
          <div key={node.id} className={`flex items-center justify-between tree-node ${node.status}`}>
            <span>{node.name}</span>
            <div className="flex space-x-2">
              <button className="btn btn-primary text-xs">
                确认
              </button>
              <button className="btn btn-danger text-xs">
                删除
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between tree-node">
          <span>...</span>
          <button className="btn btn-primary text-xs">
            查看更多
          </button>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <p>提示：未分类的节点如果 7 天内未被确认，会逐渐枯萎并最终被归档</p>
      </div>
    </div>
  );
};

export default UncategorizedNodes;
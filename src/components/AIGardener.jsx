import React from 'react';

const AIGardener = () => {
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-4">AI 园丁模式</h3>
      <div className="suggestion-card primary">
        <h4 className="font-medium mb-2">智能归类建议</h4>
        <p className="mb-4">检测到你有多个关于「编程」的记录，是否自动创建一个「编程语言」分类，并将它们归纳进去？</p>
        <div className="flex space-x-4">
          <button className="btn btn-primary">
            确认
          </button>
          <button className="btn btn-outline">
            取消
          </button>
        </div>
      </div>
      <div className="suggestion-card warning">
        <h4 className="font-medium mb-2">子分类建议</h4>
        <p className="mb-4">你的「技能树」太茂盛了，检测到其中「设计」、「插画」、「Figma」关联度高，是否创建一个「设计能力」子分类？</p>
        <div className="flex space-x-4">
          <button className="btn btn-primary">
            确认
          </button>
          <button className="btn btn-outline">
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGardener;
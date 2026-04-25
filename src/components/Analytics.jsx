import React from 'react';

const Analytics = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">分析</h1>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">数据统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">本周打卡</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">专注时长</p>
            <p className="text-2xl font-bold">2 小时</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">情绪平均值</p>
            <p className="text-2xl font-bold">+5</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">AI分析-层级一（数据清洗与结构化）</h2>
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2">自动标签化：#技能学习、#前端、#困难</p>
          <p className="mb-2">情绪打分：+3</p>
          <p>关联节点：React 技能树</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">AI分析-层级二（洞察与发现）</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">归因分析</h3>
            <p>检测到当你前一天睡眠不足（<6h）且摄入咖啡因时，今日专注度平均下降 40%。</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">隐性模式识别</h3>
            <p>分析显示，你的'放弃'通常发生在项目开始后的第 3 周（热情消退期），建议此时设置强制提醒。</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">性格/价值观动态画像</h3>
            <p>本月你 80% 的记录都与'帮助他人'有关，你的核心价值观正从'成就导向'向'利他导向'偏移。</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">AI分析-层级三（行动建议）</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">动态策略调整</h3>
            <p>你本周'深度学习'节点的进度滞后，但'会议'记录过多。建议下周开启'勿扰模式'，每天预留 2 小时深度工作。</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">成长树养护建议</h3>
            <p>你的'编程'技能树已经很久没生长了，要不要回顾一下上个月的笔记？</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">成长报告</h2>
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2">本周成长报告（2024-01-01 至 2024-01-07）</p>
          <p>你本周共记录了 3 条活动，主要集中在前端技能学习和项目开发。你的情绪状态整体良好，平均情绪值为 +5。</p>
          <p className="mt-2">AI 建议：继续保持当前的学习节奏，建议增加一些体育锻炼来提高专注力。</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
import React, { useState, useEffect } from 'react';
import secureStorage from '../common/utils/secureStorage.ts';

interface TutorialStep {
  title: string;
  content: string;
  icon: string;
}

const Tutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 教程步骤
  const tutorialSteps: TutorialStep[] = [
    {
      title: '欢迎使用 GrowthOS!',
      content: 'GrowthOS 是一款帮助你记录成长、追踪技能、分析数据的应用。让我们开始快速熟悉一下吧！',
      icon: '🌱'
    },
    {
      title: '记录你的活动',
      content: '在仪表盘页面，你可以记录每天的活动、学习内容、心情状态和反思。使用 #标签 可以自动关联到成长树！',
      icon: '📝'
    },
    {
      title: '查看你的记录',
      content: '在记录页面，你可以查看、搜索和过滤所有的记录。支持按日期、情绪和标签进行筛选。',
      icon: '📋'
    },
    {
      title: '探索成长树',
      content: '成长树页面展示了你的技能、认知、习惯和生活等领域的发展。每个标签都会自动创建对应的节点。',
      icon: '🌳'
    },
    {
      title: '分析你的数据',
      content: '在分析页面，你可以查看数据统计、趋势图表，以及获得 AI 分析和建议。还可以导入导出数据！',
      icon: '📊'
    },
    {
      title: '开始你的成长之旅！',
      content: '现在你已经了解了 GrowthOS 的基本功能。开始记录你的成长，让数据见证你的进步吧！',
      icon: '🚀'
    }
  ];

  // 检查是否是第一次使用
  useEffect(() => {
    const hasSeenTutorial = secureStorage.getItem('growthos-tutorial-seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  // 完成教程
  const completeTutorial = () => {
    secureStorage.setItem('growthos-tutorial-seen', true);
    setShowTutorial(false);
  };

  // 下一步
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  // 上一步
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 跳过教程
  const skipTutorial = () => {
    completeTutorial();
  };

  if (!showTutorial) {
    return null;
  }

  const currentStepData = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* 进度条 */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* 内容 */}
        <div className="p-8">
          {/* 图标 */}
          <div className="text-6xl text-center mb-6 animate-bounce">
            {currentStepData.icon}
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            {currentStepData.title}
          </h2>

          {/* 内容 */}
          <p className="text-gray-600 text-center leading-relaxed">
            {currentStepData.content}
          </p>

          {/* 步骤指示器 */}
          <div className="flex justify-center gap-2 mt-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-green-500' 
                    : index < currentStep 
                    ? 'bg-green-300' 
                    : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* 按钮 */}
        <div className="bg-gray-50 p-6 flex justify-between items-center">
          <button
            onClick={skipTutorial}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            跳过
          </button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                上一步
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              {currentStep === tutorialSteps.length - 1 ? '开始使用' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
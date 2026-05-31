import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Award,
  AlertTriangle,
  Clock,
  Target,
  Heart
} from 'lucide-react';
import type { Insight } from '../../common/services/insightsService';
import Card from './Card';

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

const InsightCard: React.FC<InsightCardProps> = memo(({ insight, onDismiss }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'trend':
        return insight.priority === 'high' ? 
          <TrendingDown size={20} /> : 
          <TrendingUp size={20} />;
      case 'achievement':
        return <Award size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'pattern':
        return <Clock size={20} />;
      case 'recommendation':
      default:
        return <Lightbulb size={20} />;
    }
  };

  const getIconBgColor = () => {
    switch (insight.type) {
      case 'trend':
        return insight.priority === 'high' ? 
          'bg-red-100 text-red-600' : 
          'bg-emerald-100 text-emerald-600';
      case 'achievement':
        return 'bg-amber-100 text-amber-600';
      case 'warning':
        return 'bg-orange-100 text-orange-600';
      case 'pattern':
        return 'bg-blue-100 text-blue-600';
      case 'recommendation':
      default:
        return 'bg-purple-100 text-purple-600';
    }
  };

  const getPriorityBorder = () => {
    switch (insight.priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-amber-500';
      case 'low':
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  const getCategoryBadge = () => {
    const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      activity: { label: '活动', icon: <Target size={12} />, color: 'bg-blue-100 text-blue-700' },
      mood: { label: '心情', icon: <Heart size={12} />, color: 'bg-pink-100 text-pink-700' },
      learning: { label: '学习', icon: <Lightbulb size={12} />, color: 'bg-purple-100 text-purple-700' },
      goal: { label: '目标', icon: <Award size={12} />, color: 'bg-amber-100 text-amber-700' },
      habit: { label: '习惯', icon: <Clock size={12} />, color: 'bg-emerald-100 text-emerald-700' }
    };
    
    const config = categoryConfig[insight.category] || categoryConfig.habit;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white rounded-xl shadow-sm p-4 ${getPriorityBorder()} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${getIconBgColor()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-gray-800 text-sm">
              {insight.title}
            </h4>
            {getCategoryBadge()}
          </div>
          
          <p className="text-sm text-gray-600 leading-relaxed">
            {insight.description}
          </p>
          
          {onDismiss && (
            <button
              onClick={() => onDismiss(insight.id)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              知道了
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

InsightCard.displayName = 'InsightCard';

export default InsightCard;

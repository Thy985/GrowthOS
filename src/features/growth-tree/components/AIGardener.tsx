import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const AIGardener = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <h3 className="font-medium mb-4">{t('growthTree.aiGardener.title', 'AI 园丁模式')}</h3>
      <div className="suggestion-card primary">
        <h4 className="font-medium mb-2">
          {t('growthTree.aiGardener.smartSortTitle', '智能归类建议')}
        </h4>
        <p className="mb-4">
          {t(
            'growthTree.aiGardener.smartSortDesc',
            '检测到你有多个关于「编程」的记录，是否自动创建一个「编程语言」分类，并将它们归纳进去？',
          )}
        </p>
        <div className="flex space-x-4">
          <button className="btn btn-primary">
            {t('growthTree.aiGardener.confirm', '确认')}
          </button>
          <button className="btn btn-outline">{t('common.cancel', '取消')}</button>
        </div>
      </div>
      <div className="suggestion-card warning">
        <h4 className="font-medium mb-2">
          {t('growthTree.aiGardener.subClassTitle', '子分类建议')}
        </h4>
        <p className="mb-4">
          {t(
            'growthTree.aiGardener.subClassDesc',
            '你的「技能树」太茂盛了，检测到其中「设计」、「插画」、「Figma」关联度高，是否创建一个「设计能力」子分类？',
          )}
        </p>
        <div className="flex space-x-4">
          <button className="btn btn-primary">
            {t('growthTree.aiGardener.confirm', '确认')}
          </button>
          <button className="btn btn-outline">{t('common.cancel', '取消')}</button>
        </div>
      </div>
    </div>
  );
});

export default AIGardener;

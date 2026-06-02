import React from 'react';
import { useTranslation } from 'react-i18next';

const GrowthTreePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="main">
      <div className="header" style={{ marginBottom: '32px' }}>
        <h1 className="heading-1">{t('growthTree.title', '成长树')}</h1>
        <p className="body-large text-secondary">{t('growthTree.subtitle', '可视化您的成长历程')}</p>
      </div>
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>🌳</div>
        <h2 className="heading-3" style={{ marginBottom: '16px' }}>
          {t('growthTree.visualizationComing', '可视化功能即将推出')}
        </h2>
        <p className="body-large text-secondary">
          {t('growthTree.description', '通过交互式树状图展示您的成长历程和知识点关联')}
        </p>
      </div>
    </div>
  );
};

export default GrowthTreePage;

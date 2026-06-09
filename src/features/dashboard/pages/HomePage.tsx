import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const Home = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{t('home.title', '仪表盘')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">
            {t('home.growthTreePreview', '成长树预览')}
          </h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-300">
              {t('home.growthTreePreviewPlaceholder', '成长树可视化区域')}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">{t('home.dailyRecord', '日常记录')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('home.whatDid', '做了什么')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('home.whatDidPlaceholder', '今天做了什么')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('home.whatLearned', '学了什么')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('home.whatLearnedPlaceholder', '今天学了什么')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('home.moodStatus', '状态如何')}
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{t('home.selectMood', '选择状态')}</option>
                <option value="happy">{t('home.moodHappy', '很好')}</option>
                <option value="neutral">{t('home.moodNeutral', '一般')}</option>
                <option value="sad">{t('home.moodBad', '不太好')}</option>
              </select>
            </div>
            <button className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
              {t('home.saveRecord', '保存记录')}
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">{t('home.recentRecords', '最近记录')}</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="font-medium">{t('home.demoTitle1', '学习 React')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">{t('home.today', '今天')}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="font-medium">{t('home.demoTitle2', '学习 TypeScript')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {t('home.yesterday', '昨天')}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="font-medium">{t('home.demoTitle3', '学习 Redux')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {t('home.daysAgo', '2天前')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Home;

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchRecords, addRecord, deleteRecord } from '../../store/slices/growthSlice';
import { type RootState, type AppDispatch } from '../../store';

const Records: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const records = useSelector((state: RootState) => state.growth.records);
  const isLoading = useSelector((state: RootState) => state.growth.isLoading);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activity: '',
    category: 'learning' as 'learning' | 'career' | 'health' | 'personal' | 'other',
    tags: [] as string[],
  });

  useEffect(() => {
    void dispatch(fetchRecords());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void dispatch(addRecord({
      activity: formData.activity,
      learning: formData.activity,
      category: formData.category,
      tags: formData.tags,
    }));
    setFormData({ activity: '', category: 'learning', tags: [] });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('records.confirmDelete', '确定要删除这条记录吗？'))) {
      void dispatch(deleteRecord(id));
    }
  };

  const getRecordContent = (record: typeof records[0]) => {
    return record.activity || record.learning || '';
  };

  return (
    <div className="main">
      <div className="header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-1">{t('records.title', '记录')}</h1>
          <p className="body-large text-secondary">{t('records.subtitle', '记录您的成长瞬间')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel', '取消') : t('records.addRecord', '添加记录')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('records.newRecord', '新记录')}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('records.content', '内容')}
              </label>
              <textarea
                className="input"
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                placeholder={t('records.contentPlaceholder', '今天发生了什么？')}
                rows={4}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('records.category', '分类')}
              </label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
              >
                <option value="learning">{t('category.learning', '学习')}</option>
                <option value="career">{t('category.career', '职业')}</option>
                <option value="health">{t('category.health', '健康')}</option>
                <option value="personal">{t('category.personal', '个人')}</option>
                <option value="other">{t('category.other', '其他')}</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {t('records.save', '保存')}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('records.allRecords', '所有记录')}</h3>
        {records.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {records.map((record) => (
              <div
                key={record.id}
                style={{
                  padding: '16px',
                  background: 'var(--color-gray-50)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge badge-info">{record.category}</span>
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '8px' }}>{getRecordContent(record)}</p>
                    <span className="caption">
                      {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleDelete(record.id)}
                    style={{ color: 'var(--color-error)' }}
                  >
                    {t('common.delete', '删除')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <h3 className="heading-4">{t('records.noRecords', '暂无记录')}</h3>
            <p className="body-small">{t('records.noRecordsDescription', '点击上方按钮添加您的第一条记录')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;

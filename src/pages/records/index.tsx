import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchRecords, addRecord, deleteRecord } from '../../store/slices/growthSlice';
import { type RootState } from '../../store';

const Records: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const records = useSelector((state: RootState) => state.growth.records);
  const isLoading = useSelector((state: RootState) => state.growth.isLoading);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    category: 'learning',
    mood: 'okay' as MoodType,
    tags: [] as string[],
  });

  useEffect(() => {
    dispatch(fetchRecords());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addRecord({
      content: formData.content,
      category: formData.category,
      mood: formData.mood,
      tags: formData.tags,
    }));
    setFormData({ content: '', category: 'learning', mood: 'okay', tags: [] });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('records.confirmDelete', '确定要删除这条记录吗？'))) {
      dispatch(deleteRecord(id));
    }
  };

  const getMoodEmoji = (mood: MoodType) => {
    switch (mood) {
      case 'great': return '😊';
      case 'okay': return '😐';
      case 'not-good': return '😔';
      default: return '😐';
    }
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
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={t('records.contentPlaceholder', '今天发生了什么？')}
                rows={4}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('records.mood', '心情')}
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['great', 'okay', 'not-good'] as MoodType[]).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood })}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: formData.mood === mood ? '2px solid var(--color-primary-500)' : '1px solid var(--color-border)',
                      background: formData.mood === mood ? 'var(--color-primary-50)' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {getMoodEmoji(mood)} {t(`mood.${mood}`, mood)}
                  </button>
                ))}
              </div>
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
                      <span style={{ fontSize: '20px' }}>{getMoodEmoji(record.mood)}</span>
                      <span className="badge badge-info">{record.category}</span>
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '8px' }}>{record.content}</p>
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

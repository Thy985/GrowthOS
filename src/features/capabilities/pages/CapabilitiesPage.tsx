/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import type { Node, Edge } from 'reactflow';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

import type { Capability, CapabilityCategory, RootState } from '../../../shared/types';
import {
  addCapability,
  deleteCapability,
  updateCapability,
  getCapabilitiesByCategory,
  getCapabilityTree,
} from '../store/capabilitySlice';

// Category config
const CATEGORY_CONFIG: Record<
  CapabilityCategory,
  { emoji: string; labelKey: string; color: string }
> = {
  mind: { emoji: '\uD83E\uDDE0', labelKey: 'capabilities.mind', color: '#8B5CF6' },
  skill: { emoji: '\uD83D\uDD27', labelKey: 'capabilities.skill', color: '#3B82F6' },
  cognition: { emoji: '\uD83D\uDCA1', labelKey: 'capabilities.cognition', color: '#F59E0B' },
  body: { emoji: '\uD83D\uDCAA', labelKey: 'capabilities.body', color: '#10B981' },
  social: { emoji: '\uD83E\uDD1D', labelKey: 'capabilities.social', color: '#EC4899' },
};

// Circular progress component
const CircularProgress: React.FC<{
  level: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}> = ({ level, size = 64, strokeWidth = 6, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (level / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
};

// New Capability Modal
const NewCapabilityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Capability, 'id' | 'createdAt' | 'lastUpdated'>) => void;
  allCapabilities: Capability[];
}> = ({ isOpen, onClose, onSubmit, allCapabilities }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    category: 'mind' as CapabilityCategory,
    parentId: '' as string,
    currentLevel: 0,
    targetLevel: 100,
    growthRate: 0,
    description: '',
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim()) return;

      onSubmit({
        userId: 'default',
        name: formData.name.trim(),
        category: formData.category,
        parentId: formData.parentId || null,
        currentLevel: formData.currentLevel,
        targetLevel: formData.targetLevel,
        growthRate: formData.growthRate,
        description: formData.description || undefined,
      });
      setFormData({
        name: '',
        category: 'mind',
        parentId: '',
        currentLevel: 0,
        targetLevel: 100,
        growthRate: 0,
        description: '',
      });
      onClose();
    },
    [formData, onSubmit, onClose],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === 'currentLevel' || name === 'targetLevel' || name === 'growthRate'
            ? Number(value)
            : value,
      }));
    },
    [],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('capabilities.newCapabilityModal')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('capabilities.name')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('capabilities.namePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('capabilities.category')}</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.emoji} {t(config.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('capabilities.parentOptional')}
            </label>
            <select
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">{t('capabilities.noneRoot')}</option>
              {allCapabilities.map((cap) => (
                <option key={cap.id} value={cap.id}>
                  {cap.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('capabilities.current')}</label>
              <input
                type="number"
                name="currentLevel"
                min={0}
                max={100}
                value={formData.currentLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('capabilities.target')}</label>
              <input
                type="number"
                name="targetLevel"
                min={0}
                max={100}
                value={formData.targetLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('capabilities.growth')}</label>
              <input
                type="number"
                name="growthRate"
                value={formData.growthRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="+/-"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('capabilities.description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('capabilities.descriptionPlaceholder')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {t('capabilities.addCapability')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {t('capabilities.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Card view
const CardView: React.FC<{
  capabilities: Capability[];
  onDelete: (id: string) => void;
  onUpdate: (data: Partial<Capability> & { id: string }) => void;
}> = ({ capabilities, onDelete, onUpdate }) => {
  const { t } = useTranslation();

  if (capabilities.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">{t('capabilities.noCapabilitiesYet')}</p>
        <p className="text-sm mt-1">{t('capabilities.getStarted')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {capabilities.map((cap) => {
        const config = CATEGORY_CONFIG[cap.category];
        const isGrowing = cap.growthRate > 0;

        return (
          <div
            key={cap.id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{cap.name}</h3>
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${config.color}18`,
                      color: config.color,
                    }}
                  >
                    {t(config.labelKey)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onDelete(cap.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                title={t('capabilities.deleteCapability')}
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                title={t('capabilities.clickIncrement')}
                onClick={() =>
                  onUpdate({
                    id: cap.id,
                    currentLevel: Math.min(cap.currentLevel + 5, 100),
                  })
                }
              >
                <CircularProgress
                  level={cap.currentLevel}
                  size={64}
                  strokeWidth={6}
                  color={config.color}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                  {cap.currentLevel}
                </span>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('capabilities.targetLabel')}</span>
                  <span className="font-medium">{cap.targetLevel}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((cap.currentLevel / cap.targetLevel) * 100, 100)}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('capabilities.progressLabel')}</span>
                  <span className="font-medium">
                    {Math.min(Math.round((cap.currentLevel / cap.targetLevel) * 100), 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1 text-sm">
              <span className="text-gray-500">{t('capabilities.thisMonthLabel')}:</span>
              <span className={`font-semibold ${isGrowing ? 'text-green-600' : 'text-red-500'}`}>
                {isGrowing ? '+' : ''}
                {cap.growthRate}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Tree view using ReactFlow
const TreeView: React.FC<{ capabilities: Capability[]; treeData: Capability[] }> = ({
  capabilities,
  treeData,
}) => {
  const { t } = useTranslation();
  const source = treeData.length > 0 ? treeData : capabilities;

  const nodes: Node[] = useMemo(() => {
    if (source.length === 0) return [];

    // Layout: place root nodes in a row, children below
    const nodeMap: Record<string, Capability[]> = {};
    source.forEach((cap) => {
      const parentId = cap.parentId || '__root__';
      nodeMap[parentId] = nodeMap[parentId] || [];
      nodeMap[parentId].push(cap);
    });

    const flowNodes: Node[] = [];
    const roots = nodeMap['__root__'] || [];
    const rowWidth = 200;
    const colHeight = 140;

    const placeNode = (cap: Capability, x: number, y: number, visited: Set<string>) => {
      if (visited.has(cap.id)) return;
      visited.add(cap.id);

      const config = CATEGORY_CONFIG[cap.category];
      flowNodes.push({
        id: cap.id,
        data: {
          label: (
            <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5">
                <span>{config.emoji}</span>
                <span className="font-medium text-sm truncate max-w-[100px]">{cap.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Lv. {cap.currentLevel}</div>
            </div>
          ),
        },
        position: { x, y },
      });

      // Place children
      const children = source.filter((c) => c.parentId === cap.id);
      const childXStart = x - ((children.length - 1) * rowWidth) / 2;
      children.forEach((child, i) => {
        placeNode(child, childXStart + i * rowWidth, y + colHeight, visited);
      });
    };

    const visited = new Set<string>();
    roots.forEach((root: Capability, i: number) => {
      const x = roots.length === 1 ? 250 : 100 + i * (rowWidth + 50);
      placeNode(root, x, 50, visited);
    });

    return flowNodes;
  }, [source]);

  const edges: Edge[] = useMemo(() => {
    return source
      .filter((cap) => cap.parentId)
      .map((cap) => ({
        id: `edge-${cap.parentId}-${cap.id}`,
        source: cap.parentId!,
        target: cap.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#cbd5e1' },
      }));
  }, [source]);

  if (source.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">{t('capabilities.noCapabilitiesDisplay')}</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-gray-50 rounded-xl border border-gray-200">
      <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.2 }}>
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

// Radar view using Recharts
const RadarView: React.FC<{ capabilities: Capability[] }> = ({ capabilities }) => {
  const { t } = useTranslation();
  const radarData = useMemo(() => {
    // Top 6 by current level
    const top6 = [...capabilities].sort((a, b) => b.currentLevel - a.currentLevel).slice(0, 6);

    return top6.map((cap) => ({
      subject: cap.name,
      level: cap.currentLevel,
      target: cap.targetLevel,
      fullMark: 100,
    }));
  }, [capabilities]);

  if (radarData.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">{t('capabilities.noCapabilitiesDisplay')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">{t('capabilities.topCapabilities')}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name={t('capabilities.currentLevel')}
            dataKey="level"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
          />
          <Radar
            name={t('capabilities.targetLevel')}
            dataKey="target"
            stroke="#94a3b8"
            fill="#94a3b8"
            fillOpacity={0.1}
            strokeDasharray="5 5"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// View type
type ViewMode = 'cards' | 'tree' | 'radar';

// Main Page Component
const CapabilitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CapabilityCategory | 'all'>('all');

  const allCapabilities = useSelector((state: RootState) => state.capabilities.capabilities);

  // Use getCapabilitiesByCategory selector when filtering by category
  const selectedCategoryCaps = useSelector((state: RootState) =>
    activeCategory === 'all' ? null : getCapabilitiesByCategory(state, activeCategory),
  );

  // Use getCapabilityTree selector for tree view data
  const _treeData = useSelector((state: RootState) => getCapabilityTree(state));

  const filteredCapabilities = useMemo(() => {
    if (selectedCategoryCaps) return selectedCategoryCaps;
    return allCapabilities;
  }, [selectedCategoryCaps, allCapabilities]);

  const categories = useMemo(() => {
    const result: { category: CapabilityCategory | 'all'; count: number }[] = [
      { category: 'all', count: allCapabilities.length },
    ];
    Object.keys(CATEGORY_CONFIG).forEach((cat) => {
      const caps = allCapabilities.filter((c) => c.category === cat);
      result.push({ category: cat as CapabilityCategory, count: caps.length });
    });
    return result;
  }, [allCapabilities]);

  const handleAddCapability = useCallback(
    (data: Omit<Capability, 'id' | 'createdAt' | 'lastUpdated'>) => {
      dispatch(addCapability(data));
    },
    [dispatch],
  );

  const handleDeleteCapability = useCallback(
    (id: string) => {
      dispatch(deleteCapability(id));
    },
    [dispatch],
  );

  const handleUpdateCapability = useCallback(
    (data: Partial<Capability> & { id: string }) => {
      dispatch(updateCapability(data));
    },
    [dispatch],
  );

  const viewModes: { key: ViewMode; labelKey: string; icon: string }[] = [
    { key: 'cards', labelKey: 'capabilities.cardView', icon: '\u229E' },
    { key: 'tree', labelKey: 'capabilities.treeView', icon: '\uD83C\uDF33' },
    { key: 'radar', labelKey: 'capabilities.radarView', icon: '\uD83D\uDCCA' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('capabilities.titlePage')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('capabilities.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          {t('capabilities.addCapabilityButton')}
        </button>
      </div>

      {/* View mode tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {viewModes.map((vm) => (
          <button
            key={vm.key}
            onClick={() => setViewMode(vm.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === vm.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="mr-1">{vm.icon}</span>
            {t(vm.labelKey)}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(({ category, count }) => {
          if (category === 'all') {
            return (
              <button
                key="all"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('common.all')} ({count})
              </button>
            );
          }
          const config = CATEGORY_CONFIG[category];
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              style={activeCategory === category ? { backgroundColor: config.color } : undefined}
            >
              {config.emoji} {t(config.labelKey)} ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {viewMode === 'cards' && (
        <CardView
          capabilities={filteredCapabilities}
          onDelete={handleDeleteCapability}
          onUpdate={handleUpdateCapability}
        />
      )}
      {viewMode === 'tree' && <TreeView capabilities={filteredCapabilities} treeData={_treeData} />}
      {viewMode === 'radar' && <RadarView capabilities={filteredCapabilities} />}

      {/* Modal */}
      <NewCapabilityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddCapability}
        allCapabilities={allCapabilities}
      />
    </div>
  );
};

export default React.memo(CapabilitiesPage);

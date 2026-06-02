import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RecordList from '../../pages/records/index.tsx';
import growthReducer from '../../store/slices/growthSlice.ts';
import { Record, Tag } from '../../common/types/index.ts';

// 模拟的测试数据
const mockRecords: Record[] = [
  {
    id: '1',
    activity: '学习React',
    learning: '学习了React的hooks',
    reflection: 'React的hooks很强大',
    mood: '很好',
    tags: ['学习', 'React'],
    createdAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: '2',
    activity: '学习Redux',
    learning: '学习了Redux Toolkit',
    reflection: 'Redux Toolkit简化了Redux的使用',
    mood: '一般',
    tags: ['学习', 'Redux'],
    createdAt: '2024-01-02T10:00:00.000Z'
  },
  {
    id: '3',
    activity: '学习TypeScript',
    learning: '学习了TypeScript的类型系统',
    reflection: 'TypeScript可以提高代码质量',
    mood: '很好',
    tags: ['学习', 'TypeScript'],
    createdAt: '2024-01-03T10:00:00.000Z'
  }
];

const mockTags: Tag[] = ['学习', 'React', 'Redux', 'TypeScript'];

// 创建测试用的store
const createTestStore = () => {
  return configureStore({
    reducer: {
      growth: growthReducer
    },
    preloadedState: {
      growth: {
        records: mockRecords,
        tags: mockTags,
        trees: [],
        isLoading: false,
        error: null
      }
    }
  });
};

describe('RecordList Component', () => {
  test('renders record list with records', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 检查是否渲染了记录列表标题
    expect(screen.getByText('记录列表')).toBeInTheDocument();
    
    // 检查是否渲染了记录
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.getByText('学习Redux')).toBeInTheDocument();
    expect(screen.getByText('学习TypeScript')).toBeInTheDocument();
    
    // 检查是否显示了记录数量
    expect(screen.getByText('显示 3 条记录')).toBeInTheDocument();
  });
  
  test('filters records by search term', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索记录...');
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    // 检查是否只显示包含React的记录
    expect(screen.getByText('显示 1 条记录')).toBeInTheDocument();
    expect(screen.queryByText('学习Redux')).not.toBeInTheDocument();
    expect(screen.queryByText('学习TypeScript')).not.toBeInTheDocument();
  });
  
  test('filters records by mood', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 点击情绪过滤按钮
    const goodMoodButton = screen.getAllByText('很好')[0]; // 第一个是过滤按钮
    fireEvent.click(goodMoodButton);
    
    // 检查是否只显示情绪为很好的记录
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.getByText('学习TypeScript')).toBeInTheDocument();
    expect(screen.queryByText('学习Redux')).not.toBeInTheDocument();
    expect(screen.getByText('显示 2 条记录')).toBeInTheDocument();
  });
  
  test('filters records by tag', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 点击标签过滤按钮
    const tagButtons = screen.getAllByText(/React/);
    const reactTagButton = tagButtons.find(button => button.textContent?.includes('#'));
    if (reactTagButton) {
      fireEvent.click(reactTagButton);
    }
    
    // 检查是否只显示包含React标签的记录
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.queryByText('学习Redux')).not.toBeInTheDocument();
    expect(screen.queryByText('学习TypeScript')).not.toBeInTheDocument();
    expect(screen.getByText('显示 1 条记录')).toBeInTheDocument();
  });
  
  test('filters records by date range', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 设置日期范围
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs[1]; // 第二个是开始日期输入框
    const endDateInput = dateInputs[2]; // 第三个是结束日期输入框
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-02' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-03' } });
    
    // 检查是否只显示日期范围内的记录
    expect(screen.getByText('显示 2 条记录')).toBeInTheDocument();
  });
  
  test('clears filters when clear button is clicked', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索记录...');
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    // 点击清除过滤按钮
    const clearButton = screen.getByText('清除过滤');
    fireEvent.click(clearButton);
    
    // 检查是否显示所有记录
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.getByText('学习Redux')).toBeInTheDocument();
    expect(screen.getByText('学习TypeScript')).toBeInTheDocument();
    expect(screen.getByText('显示 3 条记录')).toBeInTheDocument();
    
    // 检查搜索框是否被清空
    expect(searchInput.value).toBe('');
  });
  
  test('renders empty state when no records match filters', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    // 输入一个不存在的搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索记录...');
    fireEvent.change(searchInput, { target: { value: '不存在的关键词' } });
    
    // 检查是否显示空状态
    expect(screen.getByText('没有找到符合条件的记录')).toBeInTheDocument();
  });
});
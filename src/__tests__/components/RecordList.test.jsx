import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RecordList from '../../pages/records';
import growthReducer from '../../store/slices/growthSlice';

// 模拟的测试数据
const mockRecords = [
  {
    id: '1',
    activity: '学习React',
    learning: '学习了React的hooks',
    reflection: 'React的hooks很强大',
    mood: 'great',
    tags: ['学习', 'React'],
    createdAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: '2',
    activity: '学习Redux',
    learning: '学习了Redux Toolkit',
    reflection: 'Redux Toolkit简化了Redux的使用',
    mood: 'okay',
    tags: ['学习', 'Redux'],
    createdAt: '2024-01-02T10:00:00.000Z'
  }
];

const mockTags = ['学习', 'React', 'Redux'];

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
    
    expect(screen.getByText('Records')).toBeInTheDocument();
    
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.getByText('学习Redux')).toBeInTheDocument();
    
    expect(screen.getByText('Showing 2 records')).toBeInTheDocument();
  });
  
  test('filters records by search term', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    const searchInput = screen.getByPlaceholderText('Search Records');
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    expect(screen.getByText('学习')).toBeInTheDocument();
    expect(screen.queryByText('学习Redux')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 records')).toBeInTheDocument();
  });
  
  test('filters records by mood', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    const buttons = screen.getAllByText('Great');
    const goodMoodButton = buttons[0];
    fireEvent.click(goodMoodButton);
    
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.queryByText('学习Redux')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 records')).toBeInTheDocument();
  });
  
  test('clears filters when clear button is clicked', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    const searchInput = screen.getByPlaceholderText('Search Records');
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);
    
    expect(screen.getByText('学习React')).toBeInTheDocument();
    expect(screen.getByText('学习Redux')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 records')).toBeInTheDocument();
    
    expect(searchInput.value).toBe('');
  });
});

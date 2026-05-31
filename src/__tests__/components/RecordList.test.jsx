import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RecordList from '../../pages/records';
import growthReducer from '../../store/slices/growthSlice';

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
  test.skip('renders record list with records', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    expect(screen.getByText('学习React')).toBeInTheDocument();
  });
  
  test.skip('filters records by search term', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    const searchInput = screen.getByPlaceholderText('Search Records');
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    expect(screen.getByText('Showing 1 records')).toBeInTheDocument();
  });
  
  test.skip('filters records by mood', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <RecordList />
      </Provider>
    );
    
    const greatButton = screen.getByText('Great');
    fireEvent.click(greatButton);
    
    expect(screen.getByText('学习React')).toBeInTheDocument();
  });
  
  test.skip('clears filters when clear button is clicked', () => {
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
  });
});

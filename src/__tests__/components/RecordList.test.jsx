import React from 'react';
import { render, screen } from '@testing-library/react';
import RecordList from '../../components/RecordList';

jest.mock('react-redux', () => ({
  useSelector: () => [],
}));

describe('RecordList', () => {
  test('renders without crashing', () => {
    render(<RecordList />);
    expect(screen.getByText(/record list/i)).toBeInTheDocument();
  });
});

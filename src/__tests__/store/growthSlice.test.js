import growthReducer, {
  setFilter,
  setSearchQuery,
  clearError,
} from '../../store/slices/growthSlice';

describe('growthSlice', () => {
  const initialState = {
    records: [],
    isLoading: false,
    error: null,
    currentFilter: 'all',
    searchQuery: '',
  };

  test('should return the initial state', () => {
    expect(growthReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle setFilter', () => {
    const actual = growthReducer(initialState, setFilter('learning'));
    expect(actual.currentFilter).toEqual('learning');
  });

  test('should handle setSearchQuery', () => {
    const actual = growthReducer(initialState, setSearchQuery('test'));
    expect(actual.searchQuery).toEqual('test');
  });

  test('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    const actual = growthReducer(stateWithError, clearError());
    expect(actual.error).toBeNull();
  });
});

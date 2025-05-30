/**
 * Mock implementation of reset-metrics module for testing
 */

export const resetAllMetrics = jest.fn().mockImplementation(() => {
  return Promise.resolve();
});

export default {
  resetAllMetrics
};

import { useState, useEffect, useCallback } from 'react';

/**
 * 页面状态保持 Hook
 * 用于在页面切换时保持状态，返回后恢复
 * @param {string} pageKey - 页面唯一标识
 * @param {Object} defaultState - 默认状态
 * @returns {[Object, Function]} - [状态, 设置状态函数]
 */
export function usePageState(pageKey, defaultState = {}) {
  // 从 localStorage 读取保存的状态
  const getSavedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(`page_state_${pageKey}`);
      if (saved) {
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('读取页面状态失败:', e);
    }
    return defaultState;
  }, [pageKey, defaultState]);

  const [state, setState] = useState(getSavedState);

  // 状态变化时保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`page_state_${pageKey}`, JSON.stringify(state));
    } catch (e) {
      console.error('保存页面状态失败:', e);
    }
  }, [state, pageKey]);

  // 更新状态的辅助函数
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 重置状态的辅助函数
  const resetState = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(`page_state_${pageKey}`);
  }, [defaultState, pageKey]);

  return [state, updateState, resetState];
}

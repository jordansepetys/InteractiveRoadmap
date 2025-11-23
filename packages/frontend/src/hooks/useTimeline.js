import { useMemo } from 'react';

export const useTimeline = () => {
  // Calculate timeline range - 12 months centered on today
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    return { startDate: start, endDate: end };
  }, []);

  // Generate month headers
  const months = useMemo(() => {
    const monthList = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      monthList.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        key: current.getTime()
      });
      current.setMonth(current.getMonth() + 1);
    }
    return monthList;
  }, [startDate, endDate]);

  // Calculate position and width (0-100%)
  const calculatePosition = (start, end) => {
    if (!start || !end) return null;
    
    const timelineStart = startDate.getTime();
    const timelineEnd = endDate.getTime();
    const itemStart = new Date(start).getTime();
    const itemEnd = new Date(end).getTime();

    const timelineDuration = timelineEnd - timelineStart;
    
    const startOffset = itemStart - timelineStart;
    const duration = itemEnd - itemStart;

    const left = (startOffset / timelineDuration) * 100;
    const width = (duration / timelineDuration) * 100;

    return {
      left: Math.max(0, left),
      width: Math.min(100 - left, width), // Clip if it goes past end
      isVisible: (left + width) > 0 && left < 100
    };
  };

  const getTodayPosition = () => {
    const now = new Date();
    const pos = calculatePosition(now, now);
    return pos ? pos.left : null;
  };

  return {
    startDate,
    endDate,
    months,
    calculatePosition,
    getTodayPosition
  };
};

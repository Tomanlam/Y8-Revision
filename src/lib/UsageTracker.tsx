import * as React from 'react';
import { useState, useEffect } from 'react';

export const globalUsageStats: {
  reads: number;
  writes: number;
  listeners: number;
  history: { time: string; reads: number; writes: number; listeners: number }[];
} = {
  reads: 0,
  writes: 0,
  listeners: 0,
  history: []
};

const notifySubscribers = () => {
  subscribers.forEach(fn => fn());
};

const subscribers: (() => void)[] = [];

// Keep track of total session metrics for the graph
const updateHistory = () => {
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  globalUsageStats.history = [
    ...globalUsageStats.history,
    { 
      time: timeStr, 
      reads: globalUsageStats.reads, 
      writes: globalUsageStats.writes,
      listeners: globalUsageStats.listeners
    }
  ].slice(-20); // Keep last 20 snapshots
  notifySubscribers();
};

// Update history every 10 seconds if there's activity
setInterval(() => {
  updateHistory();
}, 10000);

export const trackRead = (count = 1) => {
  globalUsageStats.reads += count;
  notifySubscribers();
};

export const trackWrite = (count = 1) => {
  globalUsageStats.writes += count;
  notifySubscribers();
};

export const trackListenerAdded = () => {
  globalUsageStats.listeners += 1;
  notifySubscribers();
};

export const trackListenerRemoved = () => {
  globalUsageStats.listeners = Math.max(0, globalUsageStats.listeners - 1);
  notifySubscribers();
};

export const useUsageTracker = () => {
  const [stats, setStats] = useState({ ...globalUsageStats });

  useEffect(() => {
    const handler = () => setStats({ ...globalUsageStats });
    subscribers.push(handler);
    return () => {
      const idx = subscribers.indexOf(handler);
      if (idx > -1) subscribers.splice(idx, 1);
    };
  }, []);

  return stats;
};

// No-op provider for backwards compatibility if already used in App
export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};


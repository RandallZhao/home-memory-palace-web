export const MINUTES_PER_DAY = 1440;
export const WAKE_MINUTE = 8 * 60;
export const BEDTIME_MINUTE = 23 * 60;

export function minuteOfDay(worldMinute) {
  return ((worldMinute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function dayNumber(worldMinute) {
  return Math.floor(worldMinute / MINUTES_PER_DAY) + 1;
}

export function hunger(worldMinute, lastMealMinute) {
  const elapsed = Math.max(0, worldMinute - lastMealMinute);
  return Math.max(0, Math.min(100, 100 * (1 - elapsed / MINUTES_PER_DAY)));
}

export function fatigue(worldMinute, lastSleepMinute, needsSleep) {
  if (needsSleep) return 0;
  const elapsed = Math.max(0, worldMinute - lastSleepMinute);
  return Math.max(0, Math.min(100, 100 * (1 - elapsed / (15 * 60))));
}

export function shouldNeedSleep(worldMinute, lastSleepMinute, needsSleep) {
  return needsSleep || worldMinute - lastSleepMinute >= 15 * 60;
}

export function canStartLearning(save) {
  return fatigue(save.worldMinute, save.lastSleepMinute, save.needsSleep) > 0 && hunger(save.worldMinute, save.lastMealMinute) > 0;
}

export function nextWakeMinute(worldMinute) {
  const dayStart = Math.floor(worldMinute / MINUTES_PER_DAY) * MINUTES_PER_DAY;
  return dayStart + MINUTES_PER_DAY + WAKE_MINUTE;
}

export function formatWorldTime(worldMinute) {
  const minute = minuteOfDay(worldMinute);
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `DAY ${String(dayNumber(worldMinute)).padStart(2, '0')} · ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

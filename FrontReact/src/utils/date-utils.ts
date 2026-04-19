import { formatDistanceToNow } from 'date-fns';

/**
 * Парсит UTC дату и возвращает объект Date с правильной временной зоной
 * @param dateString - строка с датой в формате ISO или UTC
 * @returns объект Date
 */
export function parseUtcDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  let normalizedString = dateString;
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    normalizedString = dateString + 'Z';
  }
  
  return new Date(normalizedString);
}

/**
 * Форматирует дату в читаемый вид (день месяц год)
 * @param dateString - строка с датой
 * @returns отформатированная строка
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = parseUtcDate(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Форматирует дату в короткий вид (краткий формат для дат с временем)
 * @param dateString - строка с датой
 * @returns отформатированная строка
 */
export function formatDateShort(dateString: string): string {
  const date = parseUtcDate(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Форматирует дату в числовой формат (дд.мм.гггг)
 * @param dateString - строка с датой
 * @returns отформатированная строка
 */
export function formatDateNumeric(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = parseUtcDate(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Форматирует дату и время
 * @param dateString - строка с датой
 * @returns отформатированная строка с датой и временем
 */
export function formatDateTime(dateString: string): string {
  const date = parseUtcDate(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматирует только время (часы и минуты)
 * @param dateString - строка с датой
 * @returns отформатированная строка со временем
 */
export function formatTime(dateString: string): string {
  const date = parseUtcDate(dateString);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Форматирует относительное время (например "5 минут назад")
 * Использует date-fns formatDistanceToNow с правильной обработкой UTC
 * @param dateString - строка с датой
 * @param addSuffix - добавлять ли суффикс (например "назад")
 * @returns отформатированная строка
 */
export function formatRelativeTime(dateString: string, addSuffix = true): string {
  const date = parseUtcDate(dateString);
  return formatDistanceToNow(date, { addSuffix });
}

/**
 * Сколько календарных дней между сегодняшним днём (локально) и целевой датой.
 */
export function calendarDaysFromToday(target: Date): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** Склонение «день» для русского (1 день, 2 дня, 5 дней). */
export function ruDayWord(n: number): string {
  const k = Math.abs(n) % 100;
  const j = Math.abs(n) % 10;
  if (k > 10 && k < 20) return 'дней';
  if (j === 1) return 'день';
  if (j >= 2 && j <= 4) return 'дня';
  return 'дней';
}
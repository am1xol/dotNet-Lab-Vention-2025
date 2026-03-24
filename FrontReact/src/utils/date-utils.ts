import { formatDistanceToNow } from 'date-fns';

/**
 * Парсит UTC дату и возвращает объект Date с правильной временной зоной
 * @param dateString - строка с датой в формате ISO или UTC
 * @returns объект Date
 */
function parseUtcDate(dateString: string): Date {
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
/**
 * Returns a single page of items from an array.
 * @param items - The full array to paginate
 * @param page - 1-based page number
 * @param pageSize - Number of items per page
 * @returns The slice of items for the requested page
 * @example
 * paginate([1,2,3,4,5], 2, 2) // [3,4]
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Groups an array of objects by the value of a given key.
 * @param items - The array to group
 * @param key - The object key whose value determines the group
 * @returns An object mapping each distinct key value to the items in that group
 * @example
 * groupBy([{role:'a'},{role:'b'},{role:'a'}], 'role')
 * // { a: [{role:'a'},{role:'a'}], b: [{role:'b'}] }
 */
export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
  }
  return result;
}

/**
 * Wraps a function so it only executes after `delay` ms of inactivity.
 * @param fn - The function to debounce
 * @param delay - Quiet period in milliseconds before the function fires
 * @returns A debounced version of `fn`
 * @example
 * const save = debounce(() => persist(), 300);
 * input.addEventListener('input', save); // fires 300 ms after typing stops
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a deep copy of a JSON-serializable value.
 * @param obj - The value to clone
 * @returns A new value with no shared references to the original
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Splits an array into chunks of the given size.
 * @param arr - The source array
 * @param size - Maximum items per chunk
 * @returns Array of chunk arrays; the last chunk may be smaller than `size`
 * @example
 * chunk([1,2,3,4,5], 2) // [[1,2],[3,4],[5]]
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Returns a shallow copy of `obj` with the specified keys removed.
 * @param obj - The source object
 * @param keys - Keys to exclude from the result
 * @returns A new object without the omitted keys
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']) // { a: 1, c: 3 }
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Returns a shallow copy of `obj` containing only the specified keys.
 * @param obj - The source object
 * @param keys - Keys to include in the result
 * @returns A new object with only the picked keys
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Resolves after the given number of milliseconds.
 * @param ms - Duration to wait in milliseconds
 * @returns A promise that resolves when the delay has elapsed
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks whether a string is a valid email address format.
 * @param value - The string to test
 * @returns `true` if `value` matches a basic email pattern, otherwise `false`
 */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Truncates a string to `maxLength` characters, appending `...` if cut.
 * @param str - The string to truncate
 * @param maxLength - Maximum allowed length including the ellipsis
 * @returns The original string if it fits, otherwise a truncated string ending with `...`
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

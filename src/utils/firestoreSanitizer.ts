/**
 * Recursively removes `undefined` properties from objects before saving to Firestore.
 * Firestore strictly rejects documents with `undefined` values.
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined || data === null) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as unknown as T;
  }
  return data;
}

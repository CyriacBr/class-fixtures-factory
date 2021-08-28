export function makeUnique<T extends object>(array: T[]) {
  const instances = new WeakSet<T>();
  const newArray: T[] = [];
  for (const item of array) {
    if (instances.has(item)) continue;
    newArray.push(item);
    instances.add(item);
  }
  return newArray;
}

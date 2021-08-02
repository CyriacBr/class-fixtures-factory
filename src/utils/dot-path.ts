export function dotPathSet(object: any, path: string[], value: any) {
  const lastPath = path.pop();
  if (!lastPath) {
    // throw new Error(`path cannot be empty and shouldn't contain null values`);
    object = value;
    return;
  }
  let current = object;
  for (const prop of path) {
    if (!(prop in current)) {
      current[prop] = {};
    }
    current = current[prop];
  }
  current[lastPath] = value;
}

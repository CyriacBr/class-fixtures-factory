export const getEnumValues = (enumObj: any) => {
  const keysList = Object.getOwnPropertyNames(enumObj).filter(key => {
    // eslint-disable-next-line no-prototype-builtins
    return enumObj.propertyIsEnumerable(key) && key !== String(parseFloat(key));
  });
  const length = keysList.length;
  const valuesList = new Array<any>(length);
  for (let index = 0; index < length; ++index) {
    const key = keysList[index];
    const value = enumObj[key];
    valuesList[index] = value;
  }
  return valuesList;
};

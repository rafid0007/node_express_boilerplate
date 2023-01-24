export const includeObjectKeys = (obj, keysArray) => {
  if (keysArray.length === 0) return obj;
  const newObj = {};
  keysArray.forEach((key) => {
    if (obj[key]) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

export const excludeObjectKeys = (obj, keysArray) => {
  if (keysArray.length === 0) return obj;
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (!keysArray.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

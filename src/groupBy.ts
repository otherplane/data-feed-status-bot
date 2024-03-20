export function groupBy<T extends { [key: string]: any }>(
  arr: Array<T>,
  key: keyof T,
): Record<T[keyof T], Array<T>> {
  return arr.reduce(function (acc: Record<string, Array<T>>, item: T) {
    if (acc.hasOwnProperty(item[key])) {
      acc[item[key]].push(item)
    } else {
      acc[item[key]] = [item]
    }

    return acc
  }, {})
}

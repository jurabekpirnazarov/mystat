export function formatNumberWithSpaces(num: number) {
  let str;
  if (num) {
    str = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  } else {
    return 0;
  }
  return str;
}

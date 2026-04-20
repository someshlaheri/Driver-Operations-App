export const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const endOfRange = (start: Date, days: number) => {
  const date = new Date(start);
  date.setDate(date.getDate() + days);
  return date;
};

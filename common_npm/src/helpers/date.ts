
import dayjs from 'dayjs';

export const stringDateToUnix = (date: string): number => {
  return dayjs(parseInt(date)) as unknown as number;
}
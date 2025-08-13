/**
 * Utility class for manipulating JavaScript Date objects by adding time intervals.
 */
export class Tempo {

  /**
   * Adds the specified number of hours to the given date.
   * If no date is provided, the current date and time is used.
   *
   * @param hours - The number of hours to add.
   * @param currentDate - The date to add hours to. Defaults to the current date and time.
   * @returns The updated Date object.
   */
  /**
   * Adds the specified number of hours to the given date.
   * If no date is provided, the current date and time is used.
   *
   * @param hours - The number of hours to add.
   * @param currentDate - The date to add hours to. Defaults to the current date and time.
   * @returns The updated Date object.
   */
  static addHour(hours: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setHours(date.getHours() + hours);
    return date;
  }

  /**
   * Adds the specified number of minutes to the given date.
   *
   * @param minutes - The number of minutes to add.
   * @param currentDate - The date to add minutes to.
   * @returns The updated Date object.
   */
  static addMinute(minutes: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  /**
   * Adds the specified number of seconds to the given date.
   *
   * @param seconds - The number of seconds to add.
   * @param currentDate - The date to add seconds to.
   * @returns The updated Date object.
   */
  static addSecond(seconds: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setSeconds(date.getSeconds() + seconds);
    return date;
  }

  /**
   * Adds the specified number of milliseconds to the given date.
   *
   * @param milliseconds - The number of milliseconds to add.
   * @param currentDate - The date to add milliseconds to.
   * @returns The updated Date object.
   */
  static addMillisecond(milliseconds: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setMilliseconds(date.getMilliseconds() + milliseconds);
    return date;
  }
  /**
   * Adds the specified number of days to the given date.
   *
   * @param days - The number of days to add.
   * @param currentDate - The date to add days to. Defaults to the current date and time.
   * @returns The updated Date object.
   */

  static addDays(days: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
  /**
   * Adds the specified number of months to the given date.
   *
   * @param months - The number of months to add.
   * @param currentDate - The date to add months to. Defaults to the current date and time.
   * @returns The updated Date object.
   */
  static addMonths(months: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  }
  /**
   * Adds the specified number of years to the given date.
   *
   * @param years - The number of years to add.
   * @param currentDate - The date to add years to. Defaults to the current date and time.
   * @returns The updated Date object.
   */
  static addYears(years: number, currentDate?: Date): Date {
    const date = currentDate ?? new Date();
    date.setFullYear(date.getFullYear() + years);
    return date;
  }
  /**
   * Converts a Date object to a Unix timestamp (seconds since epoch).
   *
   * @param date - The date to convert.
   * @returns The Unix timestamp.
   */

  static dateToTimestamp(date: Date): number {
    return new Date(date).getTime(); //
  }

}

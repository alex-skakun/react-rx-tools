export default function isDefined<T>(value: T | undefined | null | void): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

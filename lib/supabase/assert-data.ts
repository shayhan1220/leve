export function assertData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('요청한 데이터를 찾을 수 없어요.');
  return data;
}

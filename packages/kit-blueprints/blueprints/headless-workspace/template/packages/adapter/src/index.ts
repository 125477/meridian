/**
 * 第三方 SDK / HTTP 的适配层。只允许依赖 engine，禁止依赖 ui。
 */
export interface HttpClient {
  getJson<T>(url: string): Promise<T>;
}

export function createFetchClient(baseUrl: string): HttpClient {
  return {
    async getJson<T>(url: string): Promise<T> {
      const response = await fetch(`${baseUrl}${url}`);
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      return (await response.json()) as T;
    },
  };
}

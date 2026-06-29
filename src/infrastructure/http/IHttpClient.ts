export interface HttpRequest {
  readonly url: string;
  readonly params?: Record<string, string | number | boolean | undefined>;
  readonly signal?: AbortSignal;
}

export interface IHttpClient {
  get<T>(request: HttpRequest): Promise<T>;
}

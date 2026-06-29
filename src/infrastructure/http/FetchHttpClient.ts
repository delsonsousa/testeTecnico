import { ENV } from '@shared/config/env';
import { NetworkError, UnexpectedError } from '@shared/errors/AppError';
import { HttpRequest, IHttpClient } from './IHttpClient';

export class FetchHttpClient implements IHttpClient {
  async get<T>(request: HttpRequest): Promise<T> {
    const url = this.buildUrl(request);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ENV.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: request.signal ?? controller.signal,
      });
      if (!response.ok) {
        throw new NetworkError(`Serviço respondeu com status ${response.status}.`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('A consulta demorou demais. Tente novamente.');
      }
      throw new UnexpectedError();
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(request: HttpRequest): string {
    const params = request.params ?? {};
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return query ? `${request.url}?${query}` : request.url;
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageKeyValueStore } from '@infrastructure/cache/AsyncStorageKeyValueStore';
import { FetchHttpClient } from '@infrastructure/http/FetchHttpClient';
import { NetworkError, UnexpectedError } from '@shared/errors/AppError';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AsyncStorageKeyValueStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates reads and writes to AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('cached');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const store = new AsyncStorageKeyValueStore();

    await expect(store.get('key')).resolves.toBe('cached');
    await store.set('key', 'value');

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('key');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('key', 'value');
  });
});

describe('FetchHttpClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('performs a JSON GET request with encoded query params', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true }),
    });

    const client = new FetchHttpClient();
    const data = await client.get<{ ok: boolean }>({
      url: 'https://api.test/search',
      params: { name: 'São Paulo', count: 8, skip: undefined },
    });

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search?name=S%C3%A3o%20Paulo&count=8',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('raises a NetworkError when the API returns a non-2xx status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(new FetchHttpClient().get({ url: 'https://api.test' })).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('maps request aborts to NetworkError', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(new FetchHttpClient().get({ url: 'https://api.test' })).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('maps unknown failures to UnexpectedError', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));

    await expect(new FetchHttpClient().get({ url: 'https://api.test' })).rejects.toBeInstanceOf(
      UnexpectedError,
    );
  });

  it('aborts the fetch and raises NetworkError after the configured timeout', async () => {
    jest.useFakeTimers();

    fetchMock.mockImplementation((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        (init?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    );

    const promise = new FetchHttpClient().get({ url: 'https://api.test/slow' });
    // Attach handler BEFORE advancing timers to avoid unhandled-rejection warning
    const assertion = expect(promise).rejects.toBeInstanceOf(NetworkError);

    await jest.advanceTimersByTimeAsync(10_001);
    await assertion;

    jest.useRealTimers();
  });
});

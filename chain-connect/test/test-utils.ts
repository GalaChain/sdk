const fetch = require('node-fetch');
global.fetch = fetch;

export const mockFetch = (body: Record<string, unknown>, headers?: Record<string, string>) => {
  jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
    Promise.resolve({
      json: () => Promise.resolve(body),
      headers: {
        get: (key:string) => headers?.[key]
      }
    } as Response)
  );
}

export const createRandomHash = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
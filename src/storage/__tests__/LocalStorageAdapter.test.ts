import { LocalStorageAdapter } from '../backends/LocalStorageAdapter';
import { StorageError } from '../errors';

interface Config {
  id: string,
  theme: string,
  lang: string,
}

describe('LocalStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('puts and gets back JSON', async () => {
    const a = new LocalStorageAdapter<Config>('test-config');
    await a.init();
    await a.put({ id: 'singleton', theme: 'dark', lang: 'zh-CN' });
    expect(await a.get('singleton')).toEqual({ id: 'singleton', theme: 'dark', lang: 'zh-CN' });
  });

  it('get returns null for missing key', async () => {
    const a = new LocalStorageAdapter<Config>('missing');
    await a.init();
    expect(await a.get('singleton')).toBeNull();
  });

  it('getAll returns singleton in array', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await a.init();
    expect(await a.getAll()).toEqual([]);
    await a.put({ id: 'singleton', theme: 'light', lang: 'en' });
    const all = await a.getAll();
    expect(all).toHaveLength(1);
  });

  it('put overwrites', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await a.init();
    await a.put({ id: 'singleton', theme: 'light', lang: 'en' });
    await a.put({ id: 'singleton', theme: 'dark', lang: 'zh' });
    expect((await a.get('singleton'))?.theme).toBe('dark');
  });

  it('count returns 0 or 1', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await a.init();
    expect(await a.count()).toBe(0);
    await a.put({ id: 'singleton', theme: 'light', lang: 'en' });
    expect(await a.count()).toBe(1);
  });

  it('delete returns true when key exists', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await a.init();
    await a.put({ id: 'singleton', theme: 'light', lang: 'en' });
    expect(await a.delete('singleton')).toBe(true);
    expect(await a.delete('singleton')).toBe(false);
  });

  it('clear removes the key', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await a.init();
    await a.put({ id: 'singleton', theme: 'light', lang: 'en' });
    await a.clear();
    expect(await a.get('singleton')).toBeNull();
  });

  it('throws on corrupted data', async () => {
    localStorage.setItem('bad', '{ not json');
    const a = new LocalStorageAdapter<Config>('bad');
    await a.init();
    await expect(a.get('singleton')).rejects.toThrow(StorageError);
    await expect(a.get('singleton')).rejects.toMatchObject({ code: 'CORRUPTED_DATA' });
  });

  it('rejects empty key', () => {
    expect(() => new LocalStorageAdapter<Config>('')).toThrow(/non-empty/);
  });

  it('rejects before init', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await expect(a.get('singleton')).rejects.toThrow(/not initialized/);
  });

  it('put without id throws INVALID_INPUT', async () => {
    const a = new LocalStorageAdapter<Config>('test');
    await a.init();
    await expect(a.put({ theme: 'dark', lang: 'en' } as unknown as Config))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
});

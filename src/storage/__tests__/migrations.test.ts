import { migrations, getLatestVersion } from '../schema/migrations';

describe('migrations framework', () => {
  it('has at least one migration', () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('migrations are in increasing version order', () => {
    for (let i = 1; i < migrations.length; i++) {
      expect(migrations[i].version).toBeGreaterThan(migrations[i - 1].version);
    }
  });

  it('getLatestVersion returns the highest version', () => {
    const expected = migrations[migrations.length - 1].version;
    expect(getLatestVersion()).toBe(expected);
  });

  it('every migration has a description', () => {
    migrations.forEach((m: { description: string }) => {
      expect(m.description).toBeTruthy();
    });
  });
});

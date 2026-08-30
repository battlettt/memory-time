import AsyncStorage from '@react-native-async-storage/async-storage';
import { writeCache, readCache, clearFamilyCache, clearCache } from './cache';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('cache', () => {
  it('round-trips a value', async () => {
    await writeCache('memories:fam1', [{ id: 'a' }]);
    expect(await readCache('memories:fam1')).toEqual([{ id: 'a' }]);
  });

  it('returns null for a key it has never seen', async () => {
    expect(await readCache('nothing')).toBeNull();
  });

  describe('clearFamilyCache', () => {
    it('removes the family data', async () => {
      // This is the whole point: memories, notes and photographs about
      // someone's health must not survive signing out on a shared device.
      await writeCache('memories:fam1', [{ id: 'a' }]);
      await writeCache('memories:fam2', [{ id: 'b' }]);

      await clearFamilyCache();

      expect(await readCache('memories:fam1')).toBeNull();
      expect(await readCache('memories:fam2')).toBeNull();
    });

    it('keeps device preferences, which are not family data', async () => {
      // Signing out should not reset the language the device is set to.
      await writeCache('locale', 'fr');
      await writeCache('memories:fam1', [{ id: 'a' }]);

      await clearFamilyCache();

      expect(await readCache('locale')).toBe('fr');
      expect(await readCache('memories:fam1')).toBeNull();
    });

    it('leaves keys belonging to other apps alone', async () => {
      await AsyncStorage.setItem('some-other-library:token', 'x');
      await writeCache('memories:fam1', [{ id: 'a' }]);

      await clearFamilyCache();

      expect(await AsyncStorage.getItem('some-other-library:token')).toBe('x');
    });
  });

  it('clearCache removes everything including preferences', async () => {
    await writeCache('locale', 'fr');
    await writeCache('memories:fam1', [{ id: 'a' }]);
    await clearCache();
    expect(await readCache('locale')).toBeNull();
    expect(await readCache('memories:fam1')).toBeNull();
  });
});

import { Mutex, MutexInterface } from 'async-mutex';

export class AsyncUtils {
  private static PROFILE_MUTEX = new Mutex();

  public static async runMutexForProfile(
    logic: (release: MutexInterface.Releaser) => Promise<void> | void
  ): Promise<void> {
    const release = await AsyncUtils.PROFILE_MUTEX.acquire();
    try {
      await logic(release);
    } catch (err) {
      release();
      throw err;
    }
  }
}

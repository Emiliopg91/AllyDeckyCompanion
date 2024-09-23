import { Mutex, MutexInterface } from 'async-mutex';

export class AsyncUtils {
  private static PROFILE_MUTEX = new Mutex();

  public static runMutexForProfile(logic: (release: MutexInterface.Releaser) => void): void {
    AsyncUtils.PROFILE_MUTEX.acquire().then((resolve) => {
      logic(resolve);
    });
  }
}

import { Mutex, MutexInterface } from 'async-mutex';

export class AsyncUtils {
  private static PROFILE_MUTEX = new Mutex();
  private static DISPLAY_MUTEX = new Mutex();

  public static runMutexForProfile(logic: (release: MutexInterface.Releaser) => void): void {
    AsyncUtils.PROFILE_MUTEX.acquire().then((resolve) => {
      logic(resolve);
    });
  }

  public static runMutexForDisplay(logic: (release: MutexInterface.Releaser) => void): void {
    AsyncUtils.DISPLAY_MUTEX.acquire().then((resolve) => {
      logic(resolve);
    });
  }

  public static isDisplayLocked(): boolean {
    return AsyncUtils.DISPLAY_MUTEX.isLocked();
  }
}

class CacheUtils {
  static _prefix = 'foonda:'; // 缓存key前缀
  /**
   * 根据key获取缓存数据
   * @param key 
   * @returns 
   */
  static getItem<T>(key: string): T | undefined {
    const strData = localStorage.getItem(CacheUtils._prefix + key);
    let res: T | undefined = undefined;
    if (strData) {
      try {
        res = JSON.parse(strData) as T;
      } catch (e) {
        /* empty */
      }
    }
    return res;
  }

  /**
   * 根据key设置缓存数据
   * @param key 
   * @param value
   * @returns 
   */
  static setItem(key: string, value: unknown): void {
    localStorage.setItem(CacheUtils._prefix + key, JSON.stringify(value));
  }

  /**
   * 根据key删除缓存数据
   * @param key 
   */
  static removeItem(key: string): void {
    localStorage.removeItem(CacheUtils._prefix + key);
  }
}

export default CacheUtils;

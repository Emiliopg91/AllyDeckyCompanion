export class CorsClient {
  public static fetchUrl(url: string, init?: RequestInit): Promise<Response> {
    return fetch("https://corsproxy.io/?" + encodeURIComponent(url), init);
  }
}

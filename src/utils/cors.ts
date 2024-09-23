export class CorsClient {
    public static fetchUrl(url: string, init?: RequestInit) {
        return fetch("https://corsproxy.io/?" + encodeURIComponent(url), init)
    }
}
/**
 * Thrown by helpers (auth, body parsing) and converted to a clean JSON response
 * by `handleRoute` in lib/http.ts. `publicMessage` is safe to show a caller —
 * it must never contain internal detail.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "HttpError";
  }
}

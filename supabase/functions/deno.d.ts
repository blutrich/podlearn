/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="dom.iterable" />

// Type definitions for Deno Edge Functions

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
  
  export interface ConnInfo {
    localAddr: Addr;
    remoteAddr: Addr;
  }
  
  export interface Addr {
    transport: "tcp" | "udp";
    hostname: string;
    port: number;
  }
}

declare interface RequestInit {
  body?: BodyInit | null;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal | null;
  window?: any;
}

declare interface ResponseInit {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
}

declare interface Request extends Body {
  readonly method: string;
  readonly url: string;
  readonly headers: Headers;
  readonly redirect: RequestRedirect;
  readonly credentials: RequestCredentials;
  readonly mode: RequestMode;
  readonly signal: AbortSignal;
  readonly keepalive: boolean;
  readonly cache: RequestCache;
  clone(): Request;
}

declare interface Response {
  readonly type: ResponseType;
  readonly url: string;
  readonly status: number;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly statusText: string;
  readonly headers: Headers;
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  clone(): Response;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
}

declare interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
}

declare interface Body {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
}

declare const Response: {
  prototype: Response;
  new(body?: BodyInit | null, init?: ResponseInit): Response;
  error(): Response;
  redirect(url: string, status?: number): Response;
}; 
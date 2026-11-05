import { Platform } from "react-native";

// Android emulator reaches your computer at 10.0.2.2; the iOS simulator shares localhost.
// A real phone needs your computer's Wi-Fi IP: set EXPO_PUBLIC_API_URL=http://192.168.x.x:8080
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080");

export type Tenant = { id: "cedar-cove" | "harbor-house"; name: string; token: string };
export const TENANTS: Tenant[] = [
  { id: "cedar-cove", name: "Cedar Cove", token: "cedar-cove-guest" },
  { id: "harbor-house", name: "Harbor House", token: "harbor-house-guest" },
];

export type Reservation = { id: string; guest: string; unit: string; check_in: string; check_out: string };
export type ServiceRequest = { id: string; reservation_id: string; kind: string; note: string; created_at: string; replayed?: boolean };

function requestId() {
  return Math.random().toString(16).slice(2, 14);
}

/** One key per user ACTION, reused for every retry of that action, so the server can de-duplicate (drill 18). */
export function newIdempotencyKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const rid = requestId();
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Request-Id": rid, ...(init.headers ?? {}) },
  });
  console.log(`[StayReady] ${init.method ?? "GET"} ${path} -> ${res.status} request_id=${rid}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path} (request_id=${rid})`);
  return (await res.json()) as T;
}

export const api = {
  reservations: (t: Tenant) => call<{ tenant: string; reservations: Reservation[] }>(t.token, "/stayready/v1/reservations"),
  requests: (t: Tenant) => call<{ tenant: string; service_requests: ServiceRequest[] }>(t.token, "/stayready/v1/service-requests"),
  createRequest: (t: Tenant, body: { reservation_id: string; kind: string; note: string }, idempotencyKey: string) =>
    call<ServiceRequest>(t.token, "/stayready/v1/service-requests", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Idempotency-Key": idempotencyKey },
    }),
};

/** Retry a call a few times with backoff. The SAME idempotency key goes with every attempt. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 800): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}

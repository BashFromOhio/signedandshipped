import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { API_BASE, api, newIdempotencyKey, Reservation, ServiceRequest, Tenant, TENANTS, withRetry } from "./src/api";

/** StayReady guest app: pick your stay (tenant), see your reservation, ask for something. Demo data only. */
export default function App() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  return (
    <View style={s.screen}>
      <StatusBar style="auto" />
      {tenant ? <Home tenant={tenant} signOut={() => setTenant(null)} /> : <SignIn onPick={setTenant} />}
    </View>
  );
}

function SignIn({ onPick }: { onPick: (t: Tenant) => void }) {
  return (
    <View style={s.pad}>
      <Text style={s.h1}>StayReady</Text>
      <Text style={s.muted}>Sign in as a demo guest. Each property is a separate tenant.</Text>
      {TENANTS.map((t) => (
        <Btn key={t.id} label={`Guest at ${t.name}`} onPress={() => onPick(t)} />
      ))}
      <Text style={s.small}>API: {API_BASE}</Text>
    </View>
  );
}

function Home({ tenant, signOut }: { tenant: Tenant; signOut: () => void }) {
  const [res, setRes] = useState<Reservation[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [r, q] = await Promise.all([api.reservations(tenant), api.requests(tenant)]);
      if (r.tenant !== tenant.id) setMsg(`SECURITY: asked as ${tenant.id} but got ${r.tenant}'s data`);
      setRes(r.reservations);
      setRequests(q.service_requests);
    } catch (e) {
      setMsg(`Can't reach StayReady: ${(e as Error).message}`);
    }
  }, [tenant]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function ask(kind: string) {
    if (!res[0] || busy) return;
    setBusy(true);
    const key = newIdempotencyKey(); // one key for this tap, reused by every retry
    try {
      const out = await withRetry(() => api.createRequest(tenant, { reservation_id: res[0].id, kind, note }, key));
      setMsg(out.replayed ? "Already received (duplicate retry was ignored)." : `Request ${out.id} sent.`);
      setNote("");
      await refresh();
    } catch (e) {
      setMsg(`Couldn't send: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h1}>{tenant.name}</Text>
      {msg ? <Text style={s.notice}>{msg}</Text> : null}
      <Text style={s.h2}>Your reservation</Text>
      {res.map((r) => (
        <Text key={r.id} style={s.card}>
          {r.unit} · {r.guest}
          {"\n"}
          {r.check_in} → {r.check_out}
        </Text>
      ))}
      <Text style={s.h2}>Ask for something</Text>
      <TextInput style={s.input} placeholder="Optional note" value={note} onChangeText={setNote} />
      <View style={s.row}>
        <Btn label="Towels" onPress={() => ask("towels")} disabled={busy} />
        <Btn label="Late checkout" onPress={() => ask("late_checkout")} disabled={busy} />
      </View>
      <Text style={s.h2}>Your requests ({requests.length})</Text>
      {requests.map((q) => (
        <Text key={q.id} style={s.small}>
          {q.id} · {q.kind} · {q.created_at}
        </Text>
      ))}
      <Btn label="Refresh" onPress={refresh} />
      <Btn label="Sign out" onPress={signOut} />
    </ScrollView>
  );
}

function Btn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={[s.btn, disabled && { opacity: 0.5 }]}>
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f2ee", paddingTop: Platform.OS === "android" ? 32 : 56 },
  pad: { padding: 24, gap: 10 },
  h1: { fontSize: 30, fontWeight: "800" },
  h2: { fontSize: 18, fontWeight: "700", marginTop: 14 },
  muted: { color: "#555" },
  small: { color: "#555", fontSize: 13 },
  card: { backgroundColor: "#fff", padding: 12, borderWidth: 1, borderColor: "#ddd" },
  notice: { backgroundColor: "#fff3c4", padding: 10 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", padding: 10 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: { backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 16, marginTop: 6 },
  btnText: { color: "#fff", fontWeight: "600" },
});

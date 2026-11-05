import SwiftUI

/// Four screens: demo sign-in, your routes, bus status (age + stale badge), service alerts.
struct ContentView: View {
    @State private var api: APIClient?

    var body: some View {
        NavigationStack {
            if let api {
                RoutesView(api: api, signOut: { self.api = nil })
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    Text("RouteReady").font(.largeTitle.bold())
                    Text("Where's my kid's bus? (Demo data only.)").foregroundStyle(.secondary)
                    Button("Sign in as demo parent") { api = .fromInfoPlist(token: "demo-parent") }
                        .buttonStyle(.borderedProminent)
                    Text("API: \(APIClient.fromInfoPlist(token: "").baseURL.absoluteString)").font(.footnote).foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(24)
            }
        }
    }
}

struct RoutesView: View {
    let api: APIClient
    let signOut: () -> Void
    @State private var routes: [Route] = []
    @State private var error: String?

    var body: some View {
        List {
            if let error { Text(error).foregroundStyle(.red) }
            Section("Your routes") {
                ForEach(routes) { r in
                    NavigationLink(value: r) { VStack(alignment: .leading) { Text(r.name); Text("Stop: \(r.stop)").font(.caption).foregroundStyle(.secondary) } }
                }
            }
            Section { NavigationLink("Service alerts") { AlertsView(api: api) } }
            Section { Button("Sign out", role: .destructive, action: signOut) }
        }
        .navigationTitle("RouteReady")
        .navigationDestination(for: Route.self) { StatusView(api: api, route: $0) }
        .task {
            do { routes = try await api.get("api/v1/routes", as: [Route].self) }
            catch { self.error = "Can't reach RouteReady: \(error.localizedDescription)" }
        }
    }
}

struct StatusView: View {
    let api: APIClient
    let route: Route
    @State private var status: RouteStatus?
    @State private var flagOn = false
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Stop: \(route.stop)").foregroundStyle(.secondary)
            if let s = status {
                let stale = s.isStale()
                Text(stale ? "STALE · last known position" : "LIVE")
                    .font(.headline).padding(.horizontal, 10).padding(.vertical, 4)
                    .background(stale ? Color.yellow.opacity(0.6) : Color.green.opacity(0.35))
                Text(s.status == "DELAYED" ? "Running \(s.delayMinutes) min late" : "On time").font(.title2)
                Text(ageLabel(s.ageSeconds()))
                if flagOn, let c = s.etaConfidence { Text("ETA confidence: \(Int(c * 100))%") }
            } else if let error {
                Text("OFFLINE").font(.headline)
                Text(error).foregroundStyle(.secondary)
            } else {
                ProgressView()
            }
            Spacer()
        }
        .padding(24)
        .navigationTitle(route.name)
        .task {
            while !Task.isCancelled {
                do {
                    flagOn = try await api.get("api/v1/config", as: AppConfig.self).etaConfidenceEnabled
                    status = try await api.get("api/v1/routes/\(route.id)/status", as: RouteStatus.self)
                    error = nil
                } catch {
                    self.error = error.localizedDescription
                }
                try? await Task.sleep(for: .seconds(10))
            }
        }
    }
}

struct AlertsView: View {
    let api: APIClient
    @State private var alerts: [ServiceAlert] = []

    var body: some View {
        List(alerts) { a in
            VStack(alignment: .leading) { Text("\(a.severity.uppercased()) · \(a.title)").bold(); Text(a.body) }
        }
        .navigationTitle("Service alerts")
        .task { alerts = (try? await api.get("api/v1/alerts", as: [ServiceAlert].self)) ?? [] }
    }
}

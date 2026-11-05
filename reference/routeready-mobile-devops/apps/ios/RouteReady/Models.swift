import Foundation

struct Route: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let stop: String
}

struct ServiceAlert: Codable, Identifiable {
    let id: String
    let severity: String
    let title: String
    let body: String
}

struct AppConfig: Codable {
    let etaConfidenceEnabled: Bool
    enum CodingKeys: String, CodingKey { case etaConfidenceEnabled = "eta_confidence_enabled" }
}

/// Where the bus is, as of `observedAt`. Always show HOW OLD the data is (drill 12).
struct RouteStatus: Codable {
    let routeId: String
    let status: String
    let delayMinutes: Int
    let observedAt: Date
    let isStaleFromServer: Bool?
    let etaConfidence: Double?   // contract v1.5+; Optional so older servers and JSON null both decode

    enum CodingKeys: String, CodingKey {
        case routeId = "route_id", status, delayMinutes = "delay_minutes"
        case observedAt = "observed_at", isStaleFromServer = "is_stale", etaConfidence = "eta_confidence"
    }

    static let staleAfterSeconds: TimeInterval = 120

    func ageSeconds(now: Date = Date()) -> Int { max(0, Int(now.timeIntervalSince(observedAt))) }

    /// Don't trust the server alone: a buggy server can call old data fresh.
    func isStale(now: Date = Date()) -> Bool {
        (isStaleFromServer ?? false) || now.timeIntervalSince(observedAt) > Self.staleAfterSeconds
    }

    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }
}

func ageLabel(_ seconds: Int) -> String {
    if seconds < 60 { return "updated \(seconds) s ago" }
    if seconds < 3600 { return "updated \(seconds / 60) min ago" }
    return "updated \(seconds / 3600) h ago"
}

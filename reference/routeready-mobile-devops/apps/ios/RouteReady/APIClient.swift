import Foundation
import os

/// Small async client. Every request carries an X-Request-Id that is also logged,
/// so an app log line can be matched to the API log line (MOB-114).
struct APIClient {
    let baseURL: URL
    let token: String
    private let log = Logger(subsystem: "org.routeready.parent", category: "api")

    static func fromInfoPlist(token: String) -> APIClient {
        let raw = Bundle.main.object(forInfoDictionaryKey: "RRAPIBaseURL") as? String ?? "http://localhost:8080"
        return APIClient(baseURL: URL(string: raw)!, token: token)
    }

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        let requestId = String(UUID().uuidString.prefix(12)).lowercased()
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.timeoutInterval = 8
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(requestId, forHTTPHeaderField: "X-Request-Id")
        let (data, resp) = try await URLSession.shared.data(for: req)
        let code = (resp as? HTTPURLResponse)?.statusCode ?? -1
        log.info("GET \(path, privacy: .public) -> \(code) request_id=\(requestId, privacy: .public)")
        guard (200..<300).contains(code) else {
            throw URLError(.badServerResponse, userInfo: [NSLocalizedDescriptionKey: "HTTP \(code) for \(path) (request_id=\(requestId))"])
        }
        return try RouteStatus.decoder().decode(T.self, from: data)
    }
}

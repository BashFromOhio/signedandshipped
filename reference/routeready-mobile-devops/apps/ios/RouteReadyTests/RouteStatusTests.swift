import XCTest
@testable import RouteReady

final class RouteStatusTests: XCTestCase {
    private func decode(_ json: String) throws -> RouteStatus {
        try RouteStatus.decoder().decode(RouteStatus.self, from: Data(json.utf8))
    }

    func testOldServerWithoutEtaConfidence() throws {
        let s = try decode(#"{"route_id":"r-1","status":"DELAYED","delay_minutes":4,"observed_at":"2026-09-08T13:02:10Z"}"#)
        XCTAssertEqual(s.delayMinutes, 4)
        XCTAssertNil(s.etaConfidence)
    }

    func testNullEtaConfidenceDoesNotCrash() throws {
        let s = try decode(#"{"route_id":"r-1","status":"ON_TIME","delay_minutes":0,"observed_at":"2026-09-08T13:02:10Z","eta_confidence":null}"#)
        XCTAssertNil(s.etaConfidence)
    }

    func testOldDataIsStaleEvenIfServerSaysFresh() throws {
        let s = try decode(#"{"route_id":"r-1","status":"ON_TIME","delay_minutes":0,"observed_at":"2026-09-08T13:00:00Z","is_stale":false}"#)
        XCTAssertFalse(s.isStale(now: s.observedAt.addingTimeInterval(30)))
        XCTAssertTrue(s.isStale(now: s.observedAt.addingTimeInterval(600)))
    }
}

package org.routeready.parent

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Ignore
import org.junit.Test
import java.io.File
import java.time.Instant

class RouteStatusTest {

    private fun fixture(version: String) =
        File("../../../contracts/fixtures/$version/route-status.json").readText()

    @Test fun `parses what an old 1_3 server sends (no eta_confidence)`() {
        val s = RouteStatus.parse(fixture("v1.3"))
        assertEquals("DELAYED", s.status)
        assertEquals(4, s.delayMinutes)
        assertNull(s.etaConfidence)
    }

    @Test fun `parses the 1_5 contract`() {
        val s = RouteStatus.parse(fixture("v1.5"))
        assertEquals(0.82, s.etaConfidence!!, 0.0001)
    }

    @Test fun `fresh data is live, old data is stale even if the server says fresh`() {
        val observed = Instant.parse("2026-09-08T13:00:00Z")
        val s = RouteStatus("r-1", "ON_TIME", 0, observed, serverSaysStale = false, etaConfidence = null)
        assertFalse(s.isStale(observed.plusSeconds(30)))
        assertTrue(s.isStale(observed.plusSeconds(600)))
    }

    @Ignore("Level 07 / drill 3: fix RouteStatus.parse for a JSON null, then delete this @Ignore line")
    @Test fun `a null eta_confidence does not crash`() {
        val json = """{"route_id":"r-1","status":"ON_TIME","delay_minutes":0,"observed_at":"2026-09-08T13:02:10Z","eta_confidence":null}"""
        assertNull(RouteStatus.parse(json).etaConfidence)
    }

    @Test fun `age label wording`() {
        assertEquals("updated 12 s ago", ageLabel(12))
        assertEquals("updated 10 min ago", ageLabel(600))
    }
}

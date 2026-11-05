package org.routeready.parent

import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.Instant

/** A route the signed-in parent is allowed to see. */
data class Route(val id: String, val name: String, val stop: String)

/** A service alert from the school district. */
data class Alert(val severity: String, val title: String, val body: String)

/**
 * Where the bus is, as of [observedAt]. The app must always say HOW OLD the data is (drill 12):
 * a bus position from 10 minutes ago shown as "live" is worse than no position at all.
 */
data class RouteStatus(
    val routeId: String,
    val status: String,
    val delayMinutes: Int,
    val observedAt: Instant,
    val serverSaysStale: Boolean,
    val etaConfidence: Double?, // added in contract v1.5; older servers don't send it
) {
    fun ageSeconds(now: Instant = Instant.now()): Long = Duration.between(observedAt, now).seconds.coerceAtLeast(0)

    /** Don't trust the server alone: a buggy server can say "fresh" about old data. */
    fun isStale(now: Instant = Instant.now()): Boolean = serverSaysStale || ageSeconds(now) > STALE_AFTER_SECONDS

    companion object {
        const val STALE_AFTER_SECONDS = 120L

        fun parse(json: String): RouteStatus {
            val o = JSONObject(json)
            return RouteStatus(
                routeId = o.getString("route_id"),
                status = o.getString("status"),
                delayMinutes = o.optInt("delay_minutes", 0),
                observedAt = Instant.parse(o.getString("observed_at")),
                serverSaysStale = o.optBoolean("is_stale", false),
                // KNOWN BUG (Level 07 + drill 3): has() is true when the value is JSON null,
                // and getDouble() then throws. Fix it, then remove @Ignore from the matching unit test.
                etaConfidence = if (o.has("eta_confidence")) o.getDouble("eta_confidence") else null,
            )
        }
    }
}

object Parse {
    fun routes(json: String): List<Route> {
        val a = JSONArray(json)
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            Route(o.getString("id"), o.getString("name"), o.optString("stop"))
        }
    }

    fun alerts(json: String): List<Alert> {
        val a = JSONArray(json)
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            Alert(o.optString("severity", "info"), o.getString("title"), o.optString("body"))
        }
    }

    fun etaFlag(json: String): Boolean = JSONObject(json).optBoolean("eta_confidence_enabled", false)
}

/** Human wording for data age, e.g. "updated 12 s ago". */
fun ageLabel(seconds: Long): String = when {
    seconds < 60 -> "updated $seconds s ago"
    seconds < 3600 -> "updated ${seconds / 60} min ago"
    else -> "updated ${seconds / 3600} h ago"
}

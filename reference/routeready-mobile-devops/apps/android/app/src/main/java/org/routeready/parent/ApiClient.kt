package org.routeready.parent

import android.util.Log
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/**
 * Tiny HTTP client on HttpURLConnection (no libraries). Every call sends an X-Request-Id and logs it,
 * so a line in logcat can be matched to the same line in the API log (MOB-114: link crash to request).
 */
class ApiClient(private val baseUrl: String, private val token: String) {

    class HttpError(val code: Int, val requestId: String, message: String) : IOException(message)

    fun get(path: String): String {
        val requestId = UUID.randomUUID().toString().take(12)
        val conn = URL(baseUrl + path).openConnection() as HttpURLConnection
        conn.connectTimeout = 5_000
        conn.readTimeout = 8_000
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.setRequestProperty("Accept", "application/json")
        conn.setRequestProperty("X-Request-Id", requestId)
        try {
            val code = conn.responseCode
            Log.i(TAG, "GET $path -> $code request_id=$requestId")
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val body = stream?.bufferedReader()?.use { it.readText() } ?: ""
            if (code !in 200..299) throw HttpError(code, requestId, "HTTP $code for $path (request_id=$requestId)")
            return body
        } finally {
            conn.disconnect()
        }
    }

    companion object {
        const val TAG = "RouteReady"
    }
}

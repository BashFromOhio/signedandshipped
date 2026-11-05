package org.routeready.parent

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Four screens, built in code so there is nothing hidden in XML layouts:
 * 1. demo sign-in  2. your routes  3. bus status (with data age + stale badge)  4. service alerts
 */
class MainActivity : Activity() {

    private val main = Handler(Looper.getMainLooper())
    private lateinit var api: ApiClient
    private lateinit var content: LinearLayout
    private var pollRoute: Route? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i(TAG, "start version=${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE}) api=${BuildConfig.API_BASE_URL} debug=${BuildConfig.DEBUG}")
        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(28), dp(20), dp(28))
        }
        setContentView(ScrollView(this).apply { addView(content) })
        showSignIn()
    }

    override fun onPause() {
        super.onPause()
        pollRoute = null
        main.removeCallbacksAndMessages(null)
    }

    // ---------- screens ----------

    private fun showSignIn() {
        reset("RouteReady", "Where's my kid's bus? (Demo data only.)")
        content.addView(button("Sign in as demo parent") {
            api = ApiClient(BuildConfig.API_BASE_URL, "demo-parent")
            showRoutes()
        })
        content.addView(small("API: ${BuildConfig.API_BASE_URL}\nVersion ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})"))
    }

    private fun showRoutes() {
        reset("Your routes", "Tap a route to see the bus.")
        val loading = small("Loading…").also { content.addView(it) }
        load({ Parse.routes(api.get("/api/v1/routes")) }) { routes ->
            content.removeView(loading)
            routes.forEach { r -> content.addView(button("${r.name}\nStop: ${r.stop}") { showStatus(r) }) }
            content.addView(button("Service alerts") { showAlerts() })
            content.addView(button("Sign out") { showSignIn() })
        }
    }

    private fun showStatus(route: Route) {
        reset(route.name, "Stop: ${route.stop}")
        val box = TextView(this).apply { textSize = 18f; setPadding(0, dp(12), 0, dp(12)) }
        val badge = TextView(this).apply { textSize = 14f; typeface = Typeface.DEFAULT_BOLD; setPadding(dp(10), dp(4), dp(10), dp(4)) }
        content.addView(badge)
        content.addView(box)
        content.addView(button("Back to routes") { showRoutes() })
        pollRoute = route

        fun refresh() {
            if (pollRoute != route) return
            load({
                val flagOn = Parse.etaFlag(api.get("/api/v1/config"))
                Pair(RouteStatus.parse(api.get("/api/v1/routes/${route.id}/status")), flagOn)
            }, onError = { box.text = it; badge.text = "OFFLINE"; badge.setBackgroundColor(Color.LTGRAY) }) { (s, flagOn) ->
                val stale = s.isStale()
                if (stale) Log.w(TAG, "stale data for ${s.routeId}: age=${s.ageSeconds()}s serverSaysStale=${s.serverSaysStale}")
                badge.text = if (stale) "STALE · last known position" else "LIVE"
                badge.setBackgroundColor(if (stale) Color.rgb(255, 214, 102) else Color.rgb(170, 225, 180))
                val lines = mutableListOf(
                    if (s.status == "DELAYED") "Running ${s.delayMinutes} min late" else "On time",
                    ageLabel(s.ageSeconds()),
                )
                // ETA confidence is behind a feature flag (MOB-102 / MOB-113) and only exists on contract v1.5+.
                if (flagOn && s.etaConfidence != null) lines += "ETA confidence: ${(s.etaConfidence * 100).toInt()}%"
                box.text = lines.joinToString("\n")
            }
            main.postDelayed({ refresh() }, 10_000)
        }
        refresh()
    }

    private fun showAlerts() {
        reset("Service alerts", "From your school district.")
        load({ Parse.alerts(api.get("/api/v1/alerts")) }) { alerts ->
            alerts.forEach { a -> content.addView(small("${a.severity.uppercase()} · ${a.title}\n${a.body}").apply { setPadding(0, dp(8), 0, dp(8)) }) }
            content.addView(button("Back to routes") { showRoutes() })
        }
    }

    // ---------- helpers ----------

    /**
     * Runs [work] off the main thread, then [done] on it. Network errors become a message on screen.
     * NOTE: other exceptions (like a parsing bug) are NOT caught here on purpose, so a real bug crashes
     * loudly and shows up in `adb logcat -b crash` - that's what Level 07 teaches you to debug.
     */
    private fun <T> load(work: () -> T, onError: ((String) -> Unit)? = null, done: (T) -> Unit) {
        Thread {
            try {
                val result = work()
                main.post { done(result) }
            } catch (e: java.io.IOException) {
                Log.e(TAG, "network error: ${e.message}", e)
                val msg = "Can't reach RouteReady right now.\n${e.message}"
                main.post { onError?.invoke(msg) ?: content.addView(small(msg)) }
            }
        }.start()
    }

    private fun reset(title: String, subtitle: String) {
        pollRoute = null
        main.removeCallbacksAndMessages(null)
        content.removeAllViews()
        content.addView(TextView(this).apply { text = title; textSize = 26f; typeface = Typeface.DEFAULT_BOLD })
        content.addView(small(subtitle).apply { setPadding(0, dp(4), 0, dp(16)) })
    }

    private fun button(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        gravity = Gravity.START or Gravity.CENTER_VERTICAL
        setOnClickListener { onClick() }
        layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(8) }
    }

    private fun small(t: String) = TextView(this).apply { text = t; textSize = 14f; visibility = View.VISIBLE }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    companion object {
        const val TAG = ApiClient.TAG
    }
}

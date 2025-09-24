package com.ppituru.flutter_shell

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.EventChannel
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.json.JSONObject
import java.util.*

class MainActivity: FlutterActivity() {
    private val CHANNEL = "ppituru.game/unity"
    private val EVENT_CHANNEL = "ppituru.game/unity_events"
    private lateinit var methodChannel: MethodChannel
    private lateinit var eventChannel: EventChannel
    private var eventSink: EventChannel.EventSink? = null
    private val handler = Handler(Looper.getMainLooper())

    // Game state variables
    private var isGameRunning = false
    private var currentSessionId: String? = null
    private var gameConfig: Map<String, Any>? = null
    private var gameStats = mutableMapOf<String, Any>()

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Method Channel for Unity communication
        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        methodChannel.setMethodCallHandler { call, result ->
            when (call.method) {
                "startGame" -> {
                    val playerName = call.argument<String>("playerName") ?: "Unknown"
                    val config = call.argument<Map<String, Any>>("config")
                    startGame(playerName, config, result)
                }
                "pauseGame" -> {
                    pauseGame(result)
                }
                "resumeGame" -> {
                    resumeGame(result)
                }
                "endGame" -> {
                    endGame(result)
                }
                "updateGameState" -> {
                    val updates = call.argument<Map<String, Any>>("updates") ?: emptyMap()
                    updateGameState(updates, result)
                }
                "getGameState" -> {
                    getGameState(result)
                }
                "isGameRunning" -> {
                    result.success(isGameRunning)
                }
                "sendGameInput" -> {
                    val inputType = call.argument<String>("inputType") ?: ""
                    val inputData = call.argument<Map<String, Any>>("inputData") ?: emptyMap()
                    sendGameInput(inputType, inputData, result)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }

        // Event Channel for real-time Unity events
        eventChannel = EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL)
        eventChannel.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                eventSink = events
                Log.d("Unity", "Event channel listener attached")
            }

            override fun onCancel(arguments: Any?) {
                eventSink = null
                Log.d("Unity", "Event channel listener detached")
            }
        })
    }

    private fun startGame(playerName: String, config: Map<String, Any>?, result: MethodChannel.Result) {
        try {
            if (isGameRunning) {
                result.error("GAME_RUNNING", "Game is already running", null)
                return
            }

            // Initialize game session
            currentSessionId = UUID.randomUUID().toString()
            gameConfig = config ?: getDefaultGameConfig()
            isGameRunning = true

            // Initialize game stats
            gameStats.clear()
            gameStats["score"] = 0
            gameStats["gameTime"] = 0.0
            gameStats["paintCoverage"] = 0.0
            gameStats["paintShotsUsed"] = 0
            gameStats["playerName"] = playerName
            gameStats["sessionId"] = currentSessionId!!

            Log.d("Unity", "Starting game for player: $playerName with session: $currentSessionId")

            // Send game started event
            sendGameEvent("game_started", mapOf(
                "sessionId" to currentSessionId!!,
                "playerName" to playerName,
                "config" to gameConfig!!
            ))

            // Simulate Unity initialization delay
            handler.postDelayed({
                sendGameEvent("game_initialized", mapOf(
                    "sessionId" to currentSessionId!!,
                    "ready" to true
                ))
            }, 1000)

            result.success(mapOf(
                "sessionId" to currentSessionId!!,
                "success" to true
            ))

        } catch (e: Exception) {
            Log.e("Unity", "Failed to start game", e)
            result.error("START_GAME_ERROR", e.message, null)
        }
    }

    private fun pauseGame(result: MethodChannel.Result) {
        try {
            if (!isGameRunning) {
                result.error("GAME_NOT_RUNNING", "No active game session", null)
                return
            }

            sendGameEvent("game_paused", mapOf(
                "sessionId" to currentSessionId!!,
                "timestamp" to System.currentTimeMillis()
            ))

            result.success(true)

        } catch (e: Exception) {
            Log.e("Unity", "Failed to pause game", e)
            result.error("PAUSE_GAME_ERROR", e.message, null)
        }
    }

    private fun resumeGame(result: MethodChannel.Result) {
        try {
            if (!isGameRunning) {
                result.error("GAME_NOT_RUNNING", "No active game session", null)
                return
            }

            sendGameEvent("game_resumed", mapOf(
                "sessionId" to currentSessionId!!,
                "timestamp" to System.currentTimeMillis()
            ))

            result.success(true)

        } catch (e: Exception) {
            Log.e("Unity", "Failed to resume game", e)
            result.error("RESUME_GAME_ERROR", e.message, null)
        }
    }

    private fun endGame(result: MethodChannel.Result) {
        try {
            if (!isGameRunning) {
                result.error("GAME_NOT_RUNNING", "No active game session", null)
                return
            }

            val finalStats = gameStats.toMap()
            isGameRunning = false

            sendGameEvent("game_ended", mapOf(
                "sessionId" to currentSessionId!!,
                "finalStats" to finalStats,
                "timestamp" to System.currentTimeMillis()
            ))

            currentSessionId = null
            gameStats.clear()

            result.success(finalStats)

        } catch (e: Exception) {
            Log.e("Unity", "Failed to end game", e)
            result.error("END_GAME_ERROR", e.message, null)
        }
    }

    private fun updateGameState(updates: Map<String, Any>, result: MethodChannel.Result) {
        try {
            if (!isGameRunning) {
                result.error("GAME_NOT_RUNNING", "No active game session", null)
                return
            }

            // Update game stats
            updates.forEach { (key, value) ->
                gameStats[key] = value
            }

            // Send real-time update
            sendGameEvent("game_state_updated", mapOf(
                "sessionId" to currentSessionId!!,
                "updates" to updates,
                "fullState" to gameStats.toMap()
            ))

            result.success(gameStats.toMap())

        } catch (e: Exception) {
            Log.e("Unity", "Failed to update game state", e)
            result.error("UPDATE_STATE_ERROR", e.message, null)
        }
    }

    private fun getGameState(result: MethodChannel.Result) {
        try {
            if (!isGameRunning) {
                result.success(null)
                return
            }

            result.success(mapOf(
                "sessionId" to currentSessionId!!,
                "isRunning" to isGameRunning,
                "stats" to gameStats.toMap(),
                "config" to gameConfig!!
            ))

        } catch (e: Exception) {
            Log.e("Unity", "Failed to get game state", e)
            result.error("GET_STATE_ERROR", e.message, null)
        }
    }

    private fun sendGameInput(inputType: String, inputData: Map<String, Any>, result: MethodChannel.Result) {
        try {
            if (!isGameRunning) {
                result.error("GAME_NOT_RUNNING", "No active game session", null)
                return
            }

            // Process different input types
            when (inputType) {
                "paint_shot" -> {
                    val x = inputData["x"] as? Double ?: 0.0
                    val y = inputData["y"] as? Double ?: 0.0
                    val color = inputData["color"] as? String ?: "#FF0000"

                    // Update paint shots used
                    val currentShots = gameStats["paintShotsUsed"] as? Int ?: 0
                    gameStats["paintShotsUsed"] = currentShots + 1

                    // Simulate paint coverage increase
                    val currentCoverage = gameStats["paintCoverage"] as? Double ?: 0.0
                    gameStats["paintCoverage"] = minOf(100.0, currentCoverage + 2.5)

                    // Update score based on coverage
                    val coverage = gameStats["paintCoverage"] as Double
                    gameStats["score"] = (coverage * 10).toInt()

                    sendGameEvent("paint_applied", mapOf(
                        "sessionId" to currentSessionId!!,
                        "position" to mapOf("x" to x, "y" to y),
                        "color" to color,
                        "coverage" to coverage,
                        "shotsUsed" to gameStats["paintShotsUsed"]!!
                    ))
                }

                "player_move" -> {
                    val x = inputData["x"] as? Double ?: 0.0
                    val y = inputData["y"] as? Double ?: 0.0

                    sendGameEvent("player_moved", mapOf(
                        "sessionId" to currentSessionId!!,
                        "position" to mapOf("x" to x, "y" to y)
                    ))
                }

                "jump" -> {
                    sendGameEvent("player_jumped", mapOf(
                        "sessionId" to currentSessionId!!,
                        "timestamp" to System.currentTimeMillis()
                    ))
                }
            }

            result.success(true)

        } catch (e: Exception) {
            Log.e("Unity", "Failed to send game input", e)
            result.error("INPUT_ERROR", e.message, null)
        }
    }

    private fun sendGameEvent(eventType: String, data: Map<String, Any>) {
        val event = mapOf(
            "type" to eventType,
            "data" to data,
            "timestamp" to System.currentTimeMillis()
        )

        handler.post {
            eventSink?.success(event)
        }

        Log.d("Unity", "Sent event: $eventType")
    }

    private fun getDefaultGameConfig(): Map<String, Any> {
        return mapOf(
            "playerSpeed" to 5.0,
            "jumpForce" to 10.0,
            "maxHealth" to 100,
            "paintRange" to 10.0,
            "paintRadius" to 1.0,
            "maxPaintShots" to 50,
            "gravity" to -9.81,
            "targetCoverage" to 80.0,
            "timeLimit" to 300
        )
    }

    // Simulate game timer
    private var gameTimer: Timer? = null

    private fun startGameTimer() {
        gameTimer?.cancel()
        gameTimer = Timer()
        gameTimer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                if (isGameRunning) {
                    val currentTime = gameStats["gameTime"] as? Double ?: 0.0
                    gameStats["gameTime"] = currentTime + 0.1

                    // Send periodic updates
                    sendGameEvent("game_tick", mapOf(
                        "sessionId" to currentSessionId!!,
                        "gameTime" to gameStats["gameTime"]!!
                    ))

                    // Check win condition
                    val coverage = gameStats["paintCoverage"] as? Double ?: 0.0
                    val targetCoverage = gameConfig?.get("targetCoverage") as? Double ?: 80.0

                    if (coverage >= targetCoverage) {
                        handler.post {
                            sendGameEvent("game_won", mapOf(
                                "sessionId" to currentSessionId!!,
                                "finalCoverage" to coverage,
                                "gameTime" to gameStats["gameTime"]!!,
                                "score" to gameStats["score"]!!
                            ))
                        }
                    }
                }
            }
        }, 100, 100) // 100ms intervals
    }

    override fun onDestroy() {
        super.onDestroy()
        gameTimer?.cancel()
        eventSink = null
    }
}
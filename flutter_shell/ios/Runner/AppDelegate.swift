import UIKit
import Flutter

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    private let CHANNEL = "ppituru.game/unity"
    private let EVENT_CHANNEL = "ppituru.game/unity_events"
    private var methodChannel: FlutterMethodChannel?
    private var eventChannel: FlutterEventChannel?
    private var eventSink: FlutterEventSink?

    // Game state variables
    private var isGameRunning = false
    private var currentSessionId: String?
    private var gameConfig: [String: Any]?
    private var gameStats = [String: Any]()
    private var gameTimer: Timer?

    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        guard let controller = window?.rootViewController as? FlutterViewController else {
            fatalError("rootViewController is not type FlutterViewController")
        }

        // Setup Method Channel
        methodChannel = FlutterMethodChannel(name: CHANNEL, binaryMessenger: controller.binaryMessenger)
        methodChannel?.setMethodCallHandler(handleMethodCall)

        // Setup Event Channel
        eventChannel = FlutterEventChannel(name: EVENT_CHANNEL, binaryMessenger: controller.binaryMessenger)
        eventChannel?.setStreamHandler(self)

        GeneratedPluginRegistrant.register(with: self)
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    private func handleMethodCall(call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "startGame":
            guard let args = call.arguments as? [String: Any],
                  let playerName = args["playerName"] as? String else {
                result(FlutterError(code: "INVALID_ARGUMENTS", message: "Missing playerName", details: nil))
                return
            }
            let config = args["config"] as? [String: Any]
            startGame(playerName: playerName, config: config, result: result)

        case "pauseGame":
            pauseGame(result: result)

        case "resumeGame":
            resumeGame(result: result)

        case "endGame":
            endGame(result: result)

        case "updateGameState":
            guard let args = call.arguments as? [String: Any],
                  let updates = args["updates"] as? [String: Any] else {
                result(FlutterError(code: "INVALID_ARGUMENTS", message: "Missing updates", details: nil))
                return
            }
            updateGameState(updates: updates, result: result)

        case "getGameState":
            getGameState(result: result)

        case "isGameRunning":
            result(isGameRunning)

        case "sendGameInput":
            guard let args = call.arguments as? [String: Any],
                  let inputType = args["inputType"] as? String,
                  let inputData = args["inputData"] as? [String: Any] else {
                result(FlutterError(code: "INVALID_ARGUMENTS", message: "Missing input parameters", details: nil))
                return
            }
            sendGameInput(inputType: inputType, inputData: inputData, result: result)

        default:
            result(FlutterMethodNotImplemented)
        }
    }

    private func startGame(playerName: String, config: [String: Any]?, result: @escaping FlutterResult) {
        if isGameRunning {
            result(FlutterError(code: "GAME_RUNNING", message: "Game is already running", details: nil))
            return
        }

        // Initialize game session
        currentSessionId = UUID().uuidString
        gameConfig = config ?? getDefaultGameConfig()
        isGameRunning = true

        // Initialize game stats
        gameStats.removeAll()
        gameStats["score"] = 0
        gameStats["gameTime"] = 0.0
        gameStats["paintCoverage"] = 0.0
        gameStats["paintShotsUsed"] = 0
        gameStats["playerName"] = playerName
        gameStats["sessionId"] = currentSessionId!

        print("Unity: Starting game for player: \(playerName) with session: \(currentSessionId!)")

        // Send game started event
        sendGameEvent(eventType: "game_started", data: [
            "sessionId": currentSessionId!,
            "playerName": playerName,
            "config": gameConfig!
        ])

        // Simulate Unity initialization delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.sendGameEvent(eventType: "game_initialized", data: [
                "sessionId": self.currentSessionId!,
                "ready": true
            ])
        }

        // Start game timer
        startGameTimer()

        result([
            "sessionId": currentSessionId!,
            "success": true
        ])
    }

    private func pauseGame(result: @escaping FlutterResult) {
        if !isGameRunning {
            result(FlutterError(code: "GAME_NOT_RUNNING", message: "No active game session", details: nil))
            return
        }

        sendGameEvent(eventType: "game_paused", data: [
            "sessionId": currentSessionId!,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ])

        result(true)
    }

    private func resumeGame(result: @escaping FlutterResult) {
        if !isGameRunning {
            result(FlutterError(code: "GAME_NOT_RUNNING", message: "No active game session", details: nil))
            return
        }

        sendGameEvent(eventType: "game_resumed", data: [
            "sessionId": currentSessionId!,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ])

        result(true)
    }

    private func endGame(result: @escaping FlutterResult) {
        if !isGameRunning {
            result(FlutterError(code: "GAME_NOT_RUNNING", message: "No active game session", details: nil))
            return
        }

        let finalStats = gameStats
        isGameRunning = false
        gameTimer?.invalidate()
        gameTimer = nil

        sendGameEvent(eventType: "game_ended", data: [
            "sessionId": currentSessionId!,
            "finalStats": finalStats,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ])

        currentSessionId = nil
        gameStats.removeAll()

        result(finalStats)
    }

    private func updateGameState(updates: [String: Any], result: @escaping FlutterResult) {
        if !isGameRunning {
            result(FlutterError(code: "GAME_NOT_RUNNING", message: "No active game session", details: nil))
            return
        }

        // Update game stats
        for (key, value) in updates {
            gameStats[key] = value
        }

        // Send real-time update
        sendGameEvent(eventType: "game_state_updated", data: [
            "sessionId": currentSessionId!,
            "updates": updates,
            "fullState": gameStats
        ])

        result(gameStats)
    }

    private func getGameState(result: @escaping FlutterResult) {
        if !isGameRunning {
            result(nil)
            return
        }

        result([
            "sessionId": currentSessionId!,
            "isRunning": isGameRunning,
            "stats": gameStats,
            "config": gameConfig!
        ])
    }

    private func sendGameInput(inputType: String, inputData: [String: Any], result: @escaping FlutterResult) {
        if !isGameRunning {
            result(FlutterError(code: "GAME_NOT_RUNNING", message: "No active game session", details: nil))
            return
        }

        // Process different input types
        switch inputType {
        case "paint_shot":
            let x = inputData["x"] as? Double ?? 0.0
            let y = inputData["y"] as? Double ?? 0.0
            let color = inputData["color"] as? String ?? "#FF0000"

            // Update paint shots used
            let currentShots = gameStats["paintShotsUsed"] as? Int ?? 0
            gameStats["paintShotsUsed"] = currentShots + 1

            // Simulate paint coverage increase
            let currentCoverage = gameStats["paintCoverage"] as? Double ?? 0.0
            gameStats["paintCoverage"] = min(100.0, currentCoverage + 2.5)

            // Update score based on coverage
            let coverage = gameStats["paintCoverage"] as! Double
            gameStats["score"] = Int(coverage * 10)

            sendGameEvent(eventType: "paint_applied", data: [
                "sessionId": currentSessionId!,
                "position": ["x": x, "y": y],
                "color": color,
                "coverage": coverage,
                "shotsUsed": gameStats["paintShotsUsed"]!
            ])

        case "player_move":
            let x = inputData["x"] as? Double ?? 0.0
            let y = inputData["y"] as? Double ?? 0.0

            sendGameEvent(eventType: "player_moved", data: [
                "sessionId": currentSessionId!,
                "position": ["x": x, "y": y]
            ])

        case "jump":
            sendGameEvent(eventType: "player_jumped", data: [
                "sessionId": currentSessionId!,
                "timestamp": Date().timeIntervalSince1970 * 1000
            ])

        default:
            break
        }

        result(true)
    }

    private func sendGameEvent(eventType: String, data: [String: Any]) {
        let event: [String: Any] = [
            "type": eventType,
            "data": data,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]

        DispatchQueue.main.async {
            self.eventSink?(event)
        }

        print("Unity: Sent event: \(eventType)")
    }

    private func getDefaultGameConfig() -> [String: Any] {
        return [
            "playerSpeed": 5.0,
            "jumpForce": 10.0,
            "maxHealth": 100,
            "paintRange": 10.0,
            "paintRadius": 1.0,
            "maxPaintShots": 50,
            "gravity": -9.81,
            "targetCoverage": 80.0,
            "timeLimit": 300
        ]
    }

    private func startGameTimer() {
        gameTimer?.invalidate()
        gameTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            if self.isGameRunning {
                let currentTime = self.gameStats["gameTime"] as? Double ?? 0.0
                self.gameStats["gameTime"] = currentTime + 0.1

                // Send periodic updates
                self.sendGameEvent(eventType: "game_tick", data: [
                    "sessionId": self.currentSessionId!,
                    "gameTime": self.gameStats["gameTime"]!
                ])

                // Check win condition
                let coverage = self.gameStats["paintCoverage"] as? Double ?? 0.0
                let targetCoverage = self.gameConfig?["targetCoverage"] as? Double ?? 80.0

                if coverage >= targetCoverage {
                    DispatchQueue.main.async {
                        self.sendGameEvent(eventType: "game_won", data: [
                            "sessionId": self.currentSessionId!,
                            "finalCoverage": coverage,
                            "gameTime": self.gameStats["gameTime"]!,
                            "score": self.gameStats["score"]!
                        ])
                    }
                }
            }
        }
    }
}

extension AppDelegate: FlutterStreamHandler {
    func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        eventSink = events
        print("Unity: Event channel listener attached")
        return nil
    }

    func onCancel(withArguments arguments: Any?) -> FlutterError? {
        eventSink = nil
        print("Unity: Event channel listener detached")
        return nil
    }
}

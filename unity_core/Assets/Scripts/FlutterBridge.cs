using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using Newtonsoft.Json;

namespace PittuRu.Core
{
    /// <summary>
    /// Bridge for communication between Unity and Flutter
    /// Handles Platform Channel messages and game state synchronization
    /// </summary>
    public class FlutterBridge : MonoBehaviour
    {
        [Header("Flutter Bridge Configuration")]
        public bool enableDebugLogs = true;
        public float heartbeatInterval = 1.0f;

        // Events for game lifecycle
        public UnityEvent<string> OnGameStarted;
        public UnityEvent OnGamePaused;
        public UnityEvent OnGameResumed;
        public UnityEvent<GameResult> OnGameEnded;
        public UnityEvent<GameState> OnGameStateUpdated;

        // Game state
        private GameState currentGameState;
        private bool isGameRunning = false;
        private string currentSessionId;
        private Coroutine heartbeatCoroutine;

        // Flutter communication
        private const string FLUTTER_OBJECT = "FlutterUnityWidget";

        #region Unity Lifecycle

        private void Awake()
        {
            // Ensure single instance
            if (FindObjectsOfType<FlutterBridge>().Length > 1)
            {
                Destroy(gameObject);
                return;
            }

            DontDestroyOnLoad(gameObject);
            InitializeBridge();
        }

        private void Start()
        {
            // Send ready signal to Flutter
            SendToFlutter("unity_ready", new {
                timestamp = DateTime.Now.Ticks,
                version = Application.version
            });
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (isGameRunning)
            {
                if (pauseStatus)
                {
                    PauseGame();
                }
                else
                {
                    ResumeGame();
                }
            }
        }

        private void OnDestroy()
        {
            StopHeartbeat();
        }

        #endregion

        #region Flutter Message Handlers

        /// <summary>
        /// Called from Flutter via Platform Channel
        /// </summary>
        public void OnFlutterMessage(string message)
        {
            try
            {
                var messageData = JsonConvert.DeserializeObject<FlutterMessage>(message);
                LogDebug($"Received Flutter message: {messageData.method}");

                switch (messageData.method)
                {
                    case "startGame":
                        HandleStartGame(messageData.arguments);
                        break;

                    case "pauseGame":
                        HandlePauseGame();
                        break;

                    case "resumeGame":
                        HandleResumeGame();
                        break;

                    case "endGame":
                        HandleEndGame();
                        break;

                    case "updateGameState":
                        HandleUpdateGameState(messageData.arguments);
                        break;

                    case "sendGameInput":
                        HandleGameInput(messageData.arguments);
                        break;

                    case "getGameState":
                        HandleGetGameState();
                        break;

                    default:
                        LogDebug($"Unknown Flutter message method: {messageData.method}");
                        break;
                }
            }
            catch (Exception e)
            {
                LogError($"Error processing Flutter message: {e.Message}");
            }
        }

        #endregion

        #region Game Control Methods

        private void HandleStartGame(Dictionary<string, object> arguments)
        {
            try
            {
                var playerName = arguments.GetValueOrDefault("playerName", "Player").ToString();
                var configDict = arguments.GetValueOrDefault("config", new Dictionary<string, object>()) as Dictionary<string, object>;

                var gameConfig = ParseGameConfig(configDict);

                StartGame(playerName, gameConfig);
            }
            catch (Exception e)
            {
                LogError($"Failed to start game: {e.Message}");
                SendGameError("start_game_failed", e.Message);
            }
        }

        private void StartGame(string playerName, GameConfig config)
        {
            if (isGameRunning)
            {
                LogWarning("Game is already running");
                return;
            }

            currentSessionId = Guid.NewGuid().ToString();
            currentGameState = new GameState
            {
                sessionId = currentSessionId,
                playerName = playerName,
                gameTime = 0f,
                score = 0,
                paintCoverage = 0f,
                paintShotsUsed = 0,
                maxPaintShots = config.maxPaintShots,
                isRunning = true
            };

            isGameRunning = true;

            // Initialize game systems
            var gameManager = FindObjectOfType<GameManager>();
            if (gameManager != null)
            {
                gameManager.InitializeGame(config, currentGameState);
            }

            // Start heartbeat
            StartHeartbeat();

            // Notify Flutter
            SendToFlutter("game_started", new {
                sessionId = currentSessionId,
                playerName = playerName,
                config = config,
                success = true
            });

            OnGameStarted?.Invoke(currentSessionId);
            LogDebug($"Game started for player: {playerName}");
        }

        private void HandlePauseGame()
        {
            PauseGame();
        }

        private void PauseGame()
        {
            if (!isGameRunning)
            {
                LogWarning("No active game to pause");
                return;
            }

            Time.timeScale = 0f;

            SendToFlutter("game_paused", new {
                sessionId = currentSessionId,
                timestamp = DateTime.Now.Ticks
            });

            OnGamePaused?.Invoke();
            LogDebug("Game paused");
        }

        private void HandleResumeGame()
        {
            ResumeGame();
        }

        private void ResumeGame()
        {
            if (!isGameRunning)
            {
                LogWarning("No active game to resume");
                return;
            }

            Time.timeScale = 1f;

            SendToFlutter("game_resumed", new {
                sessionId = currentSessionId,
                timestamp = DateTime.Now.Ticks
            });

            OnGameResumed?.Invoke();
            LogDebug("Game resumed");
        }

        private void HandleEndGame()
        {
            EndGame();
        }

        public void EndGame(GameResult result = null)
        {
            if (!isGameRunning)
            {
                LogWarning("No active game to end");
                return;
            }

            StopHeartbeat();
            Time.timeScale = 1f;

            if (result == null)
            {
                result = new GameResult
                {
                    sessionId = currentSessionId,
                    score = currentGameState.score,
                    gameTime = currentGameState.gameTime,
                    victory = currentGameState.paintCoverage >= 80f,
                    stats = new Dictionary<string, object>
                    {
                        {"paint_coverage", currentGameState.paintCoverage},
                        {"paint_shots_used", currentGameState.paintShotsUsed},
                        {"max_paint_shots", currentGameState.maxPaintShots}
                    }
                };
            }

            isGameRunning = false;

            SendToFlutter("game_ended", new {
                sessionId = currentSessionId,
                finalStats = result,
                timestamp = DateTime.Now.Ticks
            });

            OnGameEnded?.Invoke(result);
            LogDebug($"Game ended - Score: {result.score}, Victory: {result.victory}");
        }

        #endregion

        #region Game State Management

        private void HandleUpdateGameState(Dictionary<string, object> arguments)
        {
            if (!isGameRunning || currentGameState == null)
            {
                LogWarning("Cannot update game state - no active game");
                return;
            }

            try
            {
                UpdateGameStateFromDict(arguments);

                SendToFlutter("game_state_updated", new {
                    sessionId = currentSessionId,
                    updates = arguments,
                    fullState = currentGameState
                });

                OnGameStateUpdated?.Invoke(currentGameState);
            }
            catch (Exception e)
            {
                LogError($"Failed to update game state: {e.Message}");
            }
        }

        private void UpdateGameStateFromDict(Dictionary<string, object> updates)
        {
            foreach (var kvp in updates)
            {
                switch (kvp.Key)
                {
                    case "score":
                        if (int.TryParse(kvp.Value.ToString(), out int score))
                            currentGameState.score = score;
                        break;

                    case "gameTime":
                        if (float.TryParse(kvp.Value.ToString(), out float gameTime))
                            currentGameState.gameTime = gameTime;
                        break;

                    case "paintCoverage":
                        if (float.TryParse(kvp.Value.ToString(), out float coverage))
                            currentGameState.paintCoverage = coverage;
                        break;

                    case "paintShotsUsed":
                        if (int.TryParse(kvp.Value.ToString(), out int shots))
                            currentGameState.paintShotsUsed = shots;
                        break;
                }
            }
        }

        private void HandleGetGameState()
        {
            if (isGameRunning && currentGameState != null)
            {
                SendToFlutter("game_state_response", new {
                    sessionId = currentSessionId,
                    isRunning = isGameRunning,
                    state = currentGameState
                });
            }
            else
            {
                SendToFlutter("game_state_response", new {
                    sessionId = (string)null,
                    isRunning = false,
                    state = (GameState)null
                });
            }
        }

        #endregion

        #region Input Handling

        private void HandleGameInput(Dictionary<string, object> arguments)
        {
            if (!isGameRunning)
            {
                LogWarning("Cannot process input - no active game");
                return;
            }

            try
            {
                var inputType = arguments.GetValueOrDefault("inputType", "").ToString();
                var inputData = arguments.GetValueOrDefault("inputData", new Dictionary<string, object>()) as Dictionary<string, object>;

                ProcessGameInput(inputType, inputData);
            }
            catch (Exception e)
            {
                LogError($"Failed to process game input: {e.Message}");
            }
        }

        private void ProcessGameInput(string inputType, Dictionary<string, object> inputData)
        {
            switch (inputType)
            {
                case "paint_shot":
                    HandlePaintShot(inputData);
                    break;

                case "player_move":
                    HandlePlayerMove(inputData);
                    break;

                case "jump":
                    HandlePlayerJump(inputData);
                    break;

                default:
                    LogDebug($"Unknown input type: {inputType}");
                    break;
            }
        }

        private void HandlePaintShot(Dictionary<string, object> inputData)
        {
            var x = Convert.ToSingle(inputData.GetValueOrDefault("x", 0f));
            var y = Convert.ToSingle(inputData.GetValueOrDefault("y", 0f));
            var color = inputData.GetValueOrDefault("color", "#FF0000").ToString();

            // Update game state
            currentGameState.paintShotsUsed++;
            currentGameState.paintCoverage = Mathf.Min(100f, currentGameState.paintCoverage + 2.5f);
            currentGameState.score = Mathf.RoundToInt(currentGameState.paintCoverage * 10f);

            // Send event to Flutter
            SendToFlutter("paint_applied", new {
                sessionId = currentSessionId,
                position = new { x, y },
                color,
                coverage = currentGameState.paintCoverage,
                shotsUsed = currentGameState.paintShotsUsed
            });

            // Trigger Unity game events
            var paintSystem = FindObjectOfType<PaintSystem>();
            if (paintSystem != null)
            {
                paintSystem.ApplyPaint(new Vector2(x, y), color);
            }
        }

        private void HandlePlayerMove(Dictionary<string, object> inputData)
        {
            var x = Convert.ToSingle(inputData.GetValueOrDefault("x", 0f));
            var y = Convert.ToSingle(inputData.GetValueOrDefault("y", 0f));

            SendToFlutter("player_moved", new {
                sessionId = currentSessionId,
                position = new { x, y }
            });

            var playerController = FindObjectOfType<PlayerController>();
            if (playerController != null)
            {
                playerController.SetTargetPosition(new Vector2(x, y));
            }
        }

        private void HandlePlayerJump(Dictionary<string, object> inputData)
        {
            SendToFlutter("player_jumped", new {
                sessionId = currentSessionId,
                timestamp = DateTime.Now.Ticks
            });

            var playerController = FindObjectOfType<PlayerController>();
            if (playerController != null)
            {
                playerController.Jump();
            }
        }

        #endregion

        #region Heartbeat System

        private void StartHeartbeat()
        {
            StopHeartbeat();
            heartbeatCoroutine = StartCoroutine(HeartbeatCoroutine());
        }

        private void StopHeartbeat()
        {
            if (heartbeatCoroutine != null)
            {
                StopCoroutine(heartbeatCoroutine);
                heartbeatCoroutine = null;
            }
        }

        private IEnumerator HeartbeatCoroutine()
        {
            while (isGameRunning)
            {
                yield return new WaitForSeconds(heartbeatInterval);

                if (currentGameState != null)
                {
                    currentGameState.gameTime += heartbeatInterval;

                    SendToFlutter("game_tick", new {
                        sessionId = currentSessionId,
                        gameTime = currentGameState.gameTime,
                        gameState = currentGameState
                    });

                    // Check win condition
                    if (currentGameState.paintCoverage >= 80f)
                    {
                        SendToFlutter("game_won", new {
                            sessionId = currentSessionId,
                            finalCoverage = currentGameState.paintCoverage,
                            gameTime = currentGameState.gameTime,
                            score = currentGameState.score
                        });

                        var winResult = new GameResult
                        {
                            sessionId = currentSessionId,
                            score = currentGameState.score,
                            gameTime = currentGameState.gameTime,
                            victory = true,
                            stats = new Dictionary<string, object>
                            {
                                {"paint_coverage", currentGameState.paintCoverage},
                                {"paint_shots_used", currentGameState.paintShotsUsed},
                                {"max_paint_shots", currentGameState.maxPaintShots}
                            }
                        };

                        EndGame(winResult);
                        yield break;
                    }
                }
            }
        }

        #endregion

        #region Communication Helpers

        private void SendToFlutter(string eventType, object data)
        {
            try
            {
                var message = new {
                    type = eventType,
                    data = data,
                    timestamp = DateTime.Now.Ticks
                };

                var json = JsonConvert.SerializeObject(message);

                // Send to Flutter via GameObject message
                var flutterObject = GameObject.Find(FLUTTER_OBJECT);
                if (flutterObject != null)
                {
                    flutterObject.SendMessage("OnUnityMessage", json, SendMessageOptions.DontRequireReceiver);
                }

                LogDebug($"Sent to Flutter: {eventType}");
            }
            catch (Exception e)
            {
                LogError($"Failed to send message to Flutter: {e.Message}");
            }
        }

        private void SendGameError(string errorType, string message)
        {
            SendToFlutter("game_error", new {
                errorType,
                message,
                sessionId = currentSessionId
            });
        }

        #endregion

        #region Utility Methods

        private void InitializeBridge()
        {
            LogDebug("Flutter Bridge initialized");
        }

        private GameConfig ParseGameConfig(Dictionary<string, object> configDict)
        {
            var config = new GameConfig();

            if (configDict != null)
            {
                config.playerSpeed = Convert.ToSingle(configDict.GetValueOrDefault("playerSpeed", 5f));
                config.jumpForce = Convert.ToSingle(configDict.GetValueOrDefault("jumpForce", 10f));
                config.maxHealth = Convert.ToInt32(configDict.GetValueOrDefault("maxHealth", 100));
                config.paintRange = Convert.ToSingle(configDict.GetValueOrDefault("paintRange", 10f));
                config.paintRadius = Convert.ToSingle(configDict.GetValueOrDefault("paintRadius", 1f));
                config.maxPaintShots = Convert.ToInt32(configDict.GetValueOrDefault("maxPaintShots", 50));
                config.gravity = Convert.ToSingle(configDict.GetValueOrDefault("gravity", -9.81f));
                config.targetCoverage = Convert.ToSingle(configDict.GetValueOrDefault("targetCoverage", 80f));
                config.timeLimit = Convert.ToSingle(configDict.GetValueOrDefault("timeLimit", 300f));
            }

            return config;
        }

        private void LogDebug(string message)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"[FlutterBridge] {message}");
            }
        }

        private void LogWarning(string message)
        {
            Debug.LogWarning($"[FlutterBridge] {message}");
        }

        private void LogError(string message)
        {
            Debug.LogError($"[FlutterBridge] {message}");
        }

        #endregion
    }

    #region Data Classes

    [Serializable]
    public class FlutterMessage
    {
        public string method;
        public Dictionary<string, object> arguments;
    }

    [Serializable]
    public class GameConfig
    {
        public float playerSpeed = 5f;
        public float jumpForce = 10f;
        public int maxHealth = 100;
        public float paintRange = 10f;
        public float paintRadius = 1f;
        public int maxPaintShots = 50;
        public float gravity = -9.81f;
        public float targetCoverage = 80f;
        public float timeLimit = 300f;
    }

    [Serializable]
    public class GameState
    {
        public string sessionId;
        public string playerName;
        public float gameTime;
        public int score;
        public float paintCoverage;
        public int paintShotsUsed;
        public int maxPaintShots;
        public bool isRunning;
    }

    [Serializable]
    public class GameResult
    {
        public string sessionId;
        public int score;
        public float gameTime;
        public bool victory;
        public Dictionary<string, object> stats;
    }

    #endregion
}
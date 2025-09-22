using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

namespace PittuRu.Core
{
    public enum GameState
    {
        Initializing,
        Menu,
        Playing,
        Paused,
        GameOver,
        Victory
    }

    [System.Serializable]
    public class GameConfig : ScriptableObject
    {
        [Header("Player Settings")]
        public float playerSpeed = 5f;
        public float jumpForce = 10f;
        public int maxHealth = 100;

        [Header("Paint Settings")]
        public float paintRange = 10f;
        public float paintRadius = 1f;
        public int maxPaintShots = 50;

        [Header("Physics Settings")]
        public float gravity = -9.81f;
        public LayerMask groundLayer = 1;
        public LayerMask paintableLayer = 256;
    }

    public interface IGameSystem
    {
        void Initialize(GameConfig config);
        void UpdateGameState(float deltaTime);
        void Cleanup();
    }

    public class GameManager : MonoBehaviour, IGameSystem
    {
        [SerializeField] private GameConfig config;
        [SerializeField] private UnityEvent<GameState> onGameStateChanged;
        [SerializeField] private UnityEvent<int> onScoreChanged;
        [SerializeField] private UnityEvent<string> onPlayerNameChanged;

        public static GameManager Instance { get; private set; }

        public GameState State { get; private set; } = GameState.Initializing;
        public int Score { get; private set; } = 0;
        public string PlayerName { get; private set; } = "Player";
        public float GameTime { get; private set; } = 0f;

        private Dictionary<string, object> _gameData = new Dictionary<string, object>();

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize(config);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void Initialize(GameConfig config)
        {
            this.config = config;
            ChangeState(GameState.Menu);

            // Initialize game systems
            InitializePhysics();
            InitializePaintSystem();
            InitializeFlutterBridge();

            Debug.Log("[GameManager] Game systems initialized");
        }

        public void UpdateGameState(float deltaTime)
        {
            if (State == GameState.Playing)
            {
                GameTime += deltaTime;
                UpdateGameplay(deltaTime);
            }
        }

        public void Cleanup()
        {
            // Cleanup resources
            _gameData.Clear();
            Debug.Log("[GameManager] Game cleaned up");
        }

        private void Update()
        {
            UpdateGameState(Time.deltaTime);
        }

        private void UpdateGameplay(float deltaTime)
        {
            // Game-specific update logic
            CheckWinCondition();
            CheckGameOver();
        }

        public void StartGame(string playerName = "")
        {
            if (!string.IsNullOrEmpty(playerName))
            {
                SetPlayerName(playerName);
            }

            ResetGameData();
            ChangeState(GameState.Playing);

            // Notify Flutter
            FlutterBridge.SendToFlutter("game_started", new Dictionary<string, object>
            {
                ["player_name"] = PlayerName,
                ["game_time"] = 0f,
                ["score"] = 0
            });
        }

        public void PauseGame()
        {
            if (State == GameState.Playing)
            {
                ChangeState(GameState.Paused);
                Time.timeScale = 0f;
            }
        }

        public void ResumeGame()
        {
            if (State == GameState.Paused)
            {
                ChangeState(GameState.Playing);
                Time.timeScale = 1f;
            }
        }

        public void EndGame(bool victory = false)
        {
            ChangeState(victory ? GameState.Victory : GameState.GameOver);
            Time.timeScale = 1f;

            // Send results to Flutter
            var results = new Dictionary<string, object>
            {
                ["victory"] = victory,
                ["score"] = Score,
                ["game_time"] = GameTime,
                ["player_name"] = PlayerName,
                ["paint_coverage"] = GetPaintCoverage()
            };

            FlutterBridge.SendToFlutter("game_ended", results);
        }

        public void AddScore(int points)
        {
            Score += points;
            onScoreChanged?.Invoke(Score);

            // Notify Flutter of score change
            FlutterBridge.SendToFlutter("score_updated", new Dictionary<string, object>
            {
                ["score"] = Score,
                ["points_added"] = points
            });
        }

        public void SetPlayerName(string name)
        {
            PlayerName = name;
            onPlayerNameChanged?.Invoke(PlayerName);
        }

        public void SetGameData(string key, object value)
        {
            _gameData[key] = value;
        }

        public T GetGameData<T>(string key, T defaultValue = default(T))
        {
            return _gameData.ContainsKey(key) ? (T)_gameData[key] : defaultValue;
        }

        private void ChangeState(GameState newState)
        {
            var previousState = State;
            State = newState;
            onGameStateChanged?.Invoke(State);

            Debug.Log($"[GameManager] State changed: {previousState} -> {State}");

            // Handle state-specific logic
            OnStateChanged(previousState, newState);
        }

        private void OnStateChanged(GameState from, GameState to)
        {
            switch (to)
            {
                case GameState.Menu:
                    Time.timeScale = 1f;
                    break;

                case GameState.Playing:
                    Time.timeScale = 1f;
                    break;

                case GameState.Paused:
                    Time.timeScale = 0f;
                    break;

                case GameState.GameOver:
                case GameState.Victory:
                    Time.timeScale = 1f;
                    break;
            }
        }

        private void ResetGameData()
        {
            Score = 0;
            GameTime = 0f;
            _gameData.Clear();
        }

        private void InitializePhysics()
        {
            Physics.gravity = new Vector3(0, config.gravity, 0);
        }

        private void InitializePaintSystem()
        {
            // Initialize paint system components
            var paintSystem = FindObjectOfType<PaintSystem>();
            if (paintSystem != null)
            {
                paintSystem.Initialize(config);
            }
        }

        private void InitializeFlutterBridge()
        {
            // Register Flutter message handlers
            FlutterBridge.RegisterCallback("start_game", OnFlutterStartGame);
            FlutterBridge.RegisterCallback("pause_game", OnFlutterPauseGame);
            FlutterBridge.RegisterCallback("resume_game", OnFlutterResumeGame);
            FlutterBridge.RegisterCallback("get_game_state", OnFlutterGetGameState);
        }

        private void OnFlutterStartGame(Dictionary<string, object> data)
        {
            string playerName = data.ContainsKey("player_name") ? data["player_name"].ToString() : "";
            StartGame(playerName);
        }

        private void OnFlutterPauseGame(Dictionary<string, object> data)
        {
            PauseGame();
        }

        private void OnFlutterResumeGame(Dictionary<string, object> data)
        {
            ResumeGame();
        }

        private void OnFlutterGetGameState(Dictionary<string, object> data)
        {
            var gameState = new Dictionary<string, object>
            {
                ["state"] = State.ToString(),
                ["score"] = Score,
                ["game_time"] = GameTime,
                ["player_name"] = PlayerName,
                ["paint_coverage"] = GetPaintCoverage()
            };

            FlutterBridge.SendToFlutter("game_state_response", gameState);
        }

        private void CheckWinCondition()
        {
            float paintCoverage = GetPaintCoverage();
            if (paintCoverage >= 80f) // 80% coverage wins
            {
                EndGame(true);
            }
        }

        private void CheckGameOver()
        {
            // Check if player ran out of paint shots
            var paintSystem = FindObjectOfType<PaintSystem>();
            if (paintSystem != null && paintSystem.RemainingShots <= 0 && GetPaintCoverage() < 80f)
            {
                EndGame(false);
            }
        }

        private float GetPaintCoverage()
        {
            var paintSystem = FindObjectOfType<PaintSystem>();
            return paintSystem != null ? paintSystem.GetCoveragePercentage() : 0f;
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && State == GameState.Playing)
            {
                PauseGame();
            }
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && State == GameState.Playing)
            {
                PauseGame();
            }
        }
    }
}
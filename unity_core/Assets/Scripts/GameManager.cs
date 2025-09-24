using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using Pppituru.Core;

namespace Pppituru.Core
{
    /// <summary>
    /// Main game manager for the paint coverage game
    /// Handles game initialization, state management, and core game logic
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("Game Configuration")]
        public Transform playerSpawnPoint;
        public Transform[] enemySpawnPoints;
        public float levelWidth = 100f;
        public float levelHeight = 50f;

        [Header("Paint System")]
        public LayerMask paintableLayer = 1;
        public Material paintedMaterial;
        public Material unpaintedMaterial;

        [Header("UI References")]
        public Transform gameUI;

        // Game state
        private GameConfig currentConfig;
        private GameState currentState;
        private FlutterBridge flutterBridge;

        // Game objects
        private PlayerController playerController;
        private PaintSystem paintSystem;
        private List<EnemyController> enemies = new List<EnemyController>();

        // Level data
        private List<Renderer> paintableObjects = new List<Renderer>();
        private float totalPaintableArea;

        #region Unity Lifecycle

        private void Awake()
        {
            flutterBridge = FindObjectOfType<FlutterBridge>();
            paintSystem = FindObjectOfType<PaintSystem>();

            if (flutterBridge == null)
            {
                Debug.LogError("FlutterBridge not found in scene!");
            }

            InitializePaintableObjects();
        }

        private void Start()
        {
            // Wait for game initialization from Flutter
            if (gameUI != null)
            {
                gameUI.gameObject.SetActive(false);
            }
        }

        private void Update()
        {
            if (currentState != null && currentState.isRunning)
            {
                UpdateGameLogic();
            }
        }

        #endregion

        #region Game Initialization

        public void InitializeGame(GameConfig config, GameState initialState)
        {
            currentConfig = config;
            currentState = initialState;

            Debug.Log($"Initializing game for player: {initialState.playerName}");

            // Setup level
            SetupLevel();

            // Setup player
            SetupPlayer();

            // Setup enemies
            SetupEnemies();

            // Setup UI
            SetupUI();

            // Initialize paint system
            if (paintSystem != null)
            {
                paintSystem.Initialize(currentConfig, paintableObjects);
            }

            // Start game
            StartGameplay();
        }

        private void SetupLevel()
        {
            // Initialize paintable objects with unpainted material
            foreach (var renderer in paintableObjects)
            {
                if (renderer != null && unpaintedMaterial != null)
                {
                    renderer.material = unpaintedMaterial;
                }
            }

            // Calculate total paintable area
            CalculatePaintableArea();

            Debug.Log($"Level setup complete - {paintableObjects.Count} paintable objects, {totalPaintableArea:F2} total area");
        }

        private void SetupPlayer()
        {
            playerController = FindObjectOfType<PlayerController>();

            if (playerController == null)
            {
                // Create player if not exists
                var playerPrefab = Resources.Load<GameObject>("Prefabs/Player");
                if (playerPrefab != null)
                {
                    var playerObject = Instantiate(playerPrefab, GetPlayerSpawnPosition(), Quaternion.identity);
                    playerController = playerObject.GetComponent<PlayerController>();
                }
            }

            if (playerController != null)
            {
                playerController.Initialize(currentConfig);
                playerController.SetPosition(GetPlayerSpawnPosition());
            }
            else
            {
                Debug.LogError("Failed to setup player controller!");
            }
        }

        private void SetupEnemies()
        {
            enemies.Clear();

            // Spawn enemies at designated points
            for (int i = 0; i < enemySpawnPoints.Length; i++)
            {
                SpawnEnemy(enemySpawnPoints[i].position, i);
            }

            Debug.Log($"Spawned {enemies.Count} enemies");
        }

        private void SetupUI()
        {
            if (gameUI != null)
            {
                gameUI.gameObject.SetActive(true);
            }

            // Initialize UI components
            var uiManager = FindObjectOfType<UIManager>();
            if (uiManager != null)
            {
                uiManager.Initialize(currentState, currentConfig);
            }
        }

        #endregion

        #region Game Logic

        private void StartGameplay()
        {
            Time.timeScale = 1f;
            Debug.Log("Gameplay started!");
        }

        private void UpdateGameLogic()
        {
            // Update paint coverage
            UpdatePaintCoverage();

            // Check win/lose conditions
            CheckGameConditions();

            // Update UI
            UpdateUI();
        }

        private void UpdatePaintCoverage()
        {
            if (paintSystem != null)
            {
                float coverage = paintSystem.GetPaintCoverage();
                if (Mathf.Abs(coverage - currentState.paintCoverage) > 0.1f)
                {
                    currentState.paintCoverage = coverage;

                    // Update score based on coverage
                    currentState.score = CalculateScore();

                    // Notify Flutter of state change
                    if (flutterBridge != null)
                    {
                        var updates = new Dictionary<string, object>
                        {
                            {"paintCoverage", currentState.paintCoverage},
                            {"score", currentState.score}
                        };

                        // This would call the Flutter bridge update method
                        // flutterBridge.UpdateGameState(updates);
                    }
                }
            }
        }

        private void CheckGameConditions()
        {
            // Check win condition
            if (currentState.paintCoverage >= currentConfig.targetCoverage)
            {
                TriggerGameWin();
            }

            // Check time limit
            if (currentConfig.timeLimit > 0 && currentState.gameTime >= currentConfig.timeLimit)
            {
                TriggerGameLoss("Time limit exceeded");
            }

            // Check paint shots limit
            if (currentState.paintShotsUsed >= currentConfig.maxPaintShots && currentState.paintCoverage < currentConfig.targetCoverage)
            {
                TriggerGameLoss("Out of paint shots");
            }
        }

        private void TriggerGameWin()
        {
            Debug.Log("Game Won!");

            var result = new GameResult
            {
                sessionId = currentState.sessionId,
                score = currentState.score,
                gameTime = currentState.gameTime,
                victory = true,
                stats = new Dictionary<string, object>
                {
                    {"paint_coverage", currentState.paintCoverage},
                    {"paint_shots_used", currentState.paintShotsUsed},
                    {"max_paint_shots", currentConfig.maxPaintShots},
                    {"time_remaining", Mathf.Max(0, currentConfig.timeLimit - currentState.gameTime)}
                }
            };

            if (flutterBridge != null)
            {
                flutterBridge.EndGame(result);
            }
        }

        private void TriggerGameLoss(string reason)
        {
            Debug.Log($"Game Lost: {reason}");

            var result = new GameResult
            {
                sessionId = currentState.sessionId,
                score = currentState.score,
                gameTime = currentState.gameTime,
                victory = false,
                stats = new Dictionary<string, object>
                {
                    {"paint_coverage", currentState.paintCoverage},
                    {"paint_shots_used", currentState.paintShotsUsed},
                    {"max_paint_shots", currentConfig.maxPaintShots},
                    {"failure_reason", reason}
                }
            };

            if (flutterBridge != null)
            {
                flutterBridge.EndGame(result);
            }
        }

        #endregion

        #region Utility Methods

        private void InitializePaintableObjects()
        {
            paintableObjects.Clear();

            // Find all objects in paintable layer
            var allRenderers = FindObjectsOfType<Renderer>();
            foreach (var renderer in allRenderers)
            {
                if (((1 << renderer.gameObject.layer) & paintableLayer) != 0)
                {
                    paintableObjects.Add(renderer);
                }
            }

            Debug.Log($"Found {paintableObjects.Count} paintable objects");
        }

        private void CalculatePaintableArea()
        {
            totalPaintableArea = 0f;

            foreach (var renderer in paintableObjects)
            {
                if (renderer != null)
                {
                    // Simple area calculation based on bounds
                    var bounds = renderer.bounds;
                    float area = bounds.size.x * bounds.size.y;
                    totalPaintableArea += area;
                }
            }
        }

        private Vector3 GetPlayerSpawnPosition()
        {
            if (playerSpawnPoint != null)
            {
                return playerSpawnPoint.position;
            }

            // Default spawn position
            return new Vector3(0, 2, 0);
        }

        private void SpawnEnemy(Vector3 position, int enemyIndex)
        {
            var enemyPrefab = Resources.Load<GameObject>("Prefabs/Enemy");
            if (enemyPrefab != null)
            {
                var enemyObject = Instantiate(enemyPrefab, position, Quaternion.identity);
                var enemyController = enemyObject.GetComponent<EnemyController>();

                if (enemyController != null)
                {
                    enemyController.Initialize(enemyIndex);
                    enemies.Add(enemyController);
                }
            }
        }

        private int CalculateScore()
        {
            int baseScore = Mathf.RoundToInt(currentState.paintCoverage * 10f);

            // Time bonus (faster = better)
            float timeBonus = Mathf.Max(0, currentConfig.timeLimit - currentState.gameTime) * 2f;

            // Efficiency bonus (fewer shots = better)
            float efficiency = 1f - (currentState.paintShotsUsed / (float)currentConfig.maxPaintShots);
            float efficiencyBonus = efficiency * 100f;

            // Perfect coverage bonus
            float perfectBonus = currentState.paintCoverage >= 100f ? 200f : 0f;

            return Mathf.RoundToInt(baseScore + timeBonus + efficiencyBonus + perfectBonus);
        }

        private void UpdateUI()
        {
            var uiManager = FindObjectOfType<UIManager>();
            if (uiManager != null)
            {
                uiManager.UpdateGameState(currentState);
            }
        }

        #endregion

        #region Public API

        public GameState GetCurrentState()
        {
            return currentState;
        }

        public GameConfig GetCurrentConfig()
        {
            return currentConfig;
        }

        public float GetPaintCoverage()
        {
            return paintSystem != null ? paintSystem.GetPaintCoverage() : 0f;
        }

        public void AddPaintShot()
        {
            if (currentState != null)
            {
                currentState.paintShotsUsed++;
            }
        }

        public bool CanShootPaint()
        {
            return currentState != null &&
                   currentState.paintShotsUsed < currentConfig.maxPaintShots;
        }

        public void UsePaintBomb(Vector2 position, string colorHex)
        {
            if (paintSystem != null)
            {
                paintSystem.ApplyPaintBomb(position, colorHex);
            }
        }

        public void UsePaintBomb(Vector2 position)
        {
            if (paintSystem != null)
            {
                paintSystem.ApplyPaintBomb(position, paintSystem.GetRandomPaintColor());
            }
        }

        #endregion

        #region Debug

        private void OnDrawGizmos()
        {
            // Draw level bounds
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireCube(Vector3.zero, new Vector3(levelWidth, levelHeight, 1));

            // Draw spawn points
            if (playerSpawnPoint != null)
            {
                Gizmos.color = Color.green;
                Gizmos.DrawWireSphere(playerSpawnPoint.position, 1f);
            }

            if (enemySpawnPoints != null)
            {
                Gizmos.color = Color.red;
                foreach (var spawn in enemySpawnPoints)
                {
                    if (spawn != null)
                    {
                        Gizmos.DrawWireSphere(spawn.position, 0.5f);
                    }
                }
            }
        }

        #endregion
    }
}
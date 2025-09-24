using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Pppituru.Core;

namespace Pppituru.Core
{
    /// <summary>
    /// Handles paint application, coverage calculation, and visual effects
    /// Core system for the paint coverage game mechanics
    /// </summary>
    public class PaintSystem : MonoBehaviour
    {
        [Header("Paint Configuration")]
        public float paintRadius = 1f;
        public float maxPaintDistance = 10f;
        public LayerMask paintableLayer = 1;
        public LayerMask obstacleLayer = 2;

        [Header("Visual Effects")]
        public GameObject paintSplatPrefab;
        public GameObject paintTrailPrefab;
        public GameObject paintBombExplosionPrefab;
        public ParticleSystem paintParticles;

        [Header("Materials")]
        public Material paintedMaterial;
        public Material unpaintedMaterial;

        [Header("Paint Colors")]
        public Color[] availableColors = {
            Color.cyan,
            Color.magenta,
            Color.yellow,
            Color.green,
            Color.red,
            Color.blue
        };

        // Paint state tracking
        private Dictionary<Renderer, PaintData> paintedObjects = new Dictionary<Renderer, PaintData>();
        private List<Renderer> paintableObjects = new List<Renderer>();
        private GameConfig gameConfig;

        // Paint effects
        private Queue<GameObject> paintSplatPool = new Queue<GameObject>();
        private Queue<GameObject> paintTrailPool = new Queue<GameObject>();

        // Coverage calculation
        private float totalPaintableArea;
        private float totalPaintedArea;

        #region Unity Lifecycle

        private void Awake()
        {
            InitializeObjectPools();
        }

        private void Start()
        {
            SetupPaintSystem();
        }

        #endregion

        #region Initialization

        public void Initialize(GameConfig config, List<Renderer> paintables)
        {
            gameConfig = config;
            paintableObjects = new List<Renderer>(paintables);

            paintRadius = config.paintRadius;
            maxPaintDistance = config.paintRange;

            InitializePaintableObjects();
            CalculateTotalArea();

            Debug.Log($"Paint system initialized - {paintableObjects.Count} paintable objects, {totalPaintableArea:F2} total area");
        }

        private void SetupPaintSystem()
        {
            if (paintParticles == null)
            {
                paintParticles = GetComponentInChildren<ParticleSystem>();
            }
        }

        private void InitializeObjectPools()
        {
            // Pre-instantiate paint effect objects
            for (int i = 0; i < 20; i++)
            {
                if (paintSplatPrefab != null)
                {
                    var splat = Instantiate(paintSplatPrefab);
                    splat.SetActive(false);
                    paintSplatPool.Enqueue(splat);
                }

                if (paintTrailPrefab != null)
                {
                    var trail = Instantiate(paintTrailPrefab);
                    trail.SetActive(false);
                    paintTrailPool.Enqueue(trail);
                }
            }
        }

        private void InitializePaintableObjects()
        {
            paintedObjects.Clear();

            foreach (var renderer in paintableObjects)
            {
                if (renderer != null)
                {
                    var paintData = new PaintData
                    {
                        renderer = renderer,
                        originalMaterial = renderer.material,
                        paintedArea = 0f,
                        totalArea = CalculateObjectArea(renderer),
                        paintPoints = new List<Vector2>()
                    };

                    paintedObjects[renderer] = paintData;

                    // Set to unpainted material
                    if (unpaintedMaterial != null)
                    {
                        renderer.material = unpaintedMaterial;
                    }
                }
            }
        }

        private void CalculateTotalArea()
        {
            totalPaintableArea = 0f;

            foreach (var paintData in paintedObjects.Values)
            {
                totalPaintableArea += paintData.totalArea;
            }
        }

        #endregion

        #region Paint Application

        public bool ApplyPaint(Vector2 position, string colorHex = "#00FFFF")
        {
            return ApplyPaint(position, colorHex, 1f);
        }

        public bool ApplyPaint(Vector2 position, string colorHex, float radiusMultiplier)
        {
            Vector3 worldPosition = new Vector3(position.x, position.y, 0);

            // Check if position is within range and not blocked
            if (!IsValidPaintPosition(worldPosition))
            {
                return false;
            }

            // Parse color
            Color paintColor;
            if (!ColorUtility.TryParseHtmlString(colorHex, out paintColor))
            {
                paintColor = Color.cyan; // Default color
            }

            // Apply paint to nearby objects
            bool paintApplied = false;
            foreach (var kvp in paintedObjects)
            {
                var renderer = kvp.Key;
                var paintData = kvp.Value;

                if (renderer != null && IsWithinPaintRadius(worldPosition, renderer, radiusMultiplier))
                {
                    ApplyPaintToObject(renderer, paintData, worldPosition, paintColor, radiusMultiplier);
                    paintApplied = true;
                }
            }

            if (paintApplied)
            {
                // Create visual effects
                CreatePaintEffects(worldPosition, paintColor);

                // Update coverage
                UpdatePaintCoverage();

                // Notify game manager
                var gameManager = FindObjectOfType<GameManager>();
                if (gameManager != null)
                {
                    gameManager.AddPaintShot();
                }
            }

            return paintApplied;
        }

        public bool ApplyPaintBomb(Vector2 position, string colorHex = "#00FFFF", float radiusMultiplier = 3f)
        {
            bool applied = ApplyPaint(position, colorHex, radiusMultiplier);
            if (applied && paintBombExplosionPrefab != null)
            {n                GameObject explosion = Instantiate(paintBombExplosionPrefab, new Vector3(position.x, position.y, 0), Quaternion.identity);
                Destroy(explosion, 2f);
            }
            return applied;
        }

        public bool ApplyPaintBomb(Vector2 position, string colorHex = "#FF0000", float radiusMultiplier = 3.0f)
        {
            Vector3 worldPosition = new Vector3(position.x, position.y, 0);

            if (!IsValidPaintPosition(worldPosition))
            {
                return false;
            }

            Color paintColor;
            if (!ColorUtility.TryParseHtmlString(colorHex, out paintColor))
            {
                paintColor = Color.red;
            }

            bool paintApplied = false;
            foreach (var kvp in paintedObjects)
            {
                var renderer = kvp.Key;
                var paintData = kvp.Value;

                if (renderer != null && IsWithinPaintRadius(worldPosition, renderer, radiusMultiplier))
                {
                    ApplyPaintToObject(renderer, paintData, worldPosition, paintColor, radiusMultiplier);
                    paintApplied = true;
                }
            }

            if (paintApplied)
            {
                CreatePaintBombEffects(worldPosition, paintColor);
                UpdatePaintCoverage();
            }

            return paintApplied;
        }

        private void ApplyPaintToObject(Renderer renderer, PaintData paintData, Vector3 paintPosition, Color paintColor, float radiusMultiplier = 1f)
        {
            // Calculate local paint position
            Vector3 localPosition = renderer.transform.InverseTransformPoint(paintPosition);

            // Add paint point
            paintData.paintPoints.Add(new Vector2(localPosition.x, localPosition.y));

            // Calculate additional painted area
            float additionalArea = Mathf.PI * (paintRadius * radiusMultiplier) * (paintRadius * radiusMultiplier);
            paintData.paintedArea = Mathf.Min(paintData.totalArea, paintData.paintedArea + additionalArea);

            // Update material if enough area is painted
            float paintPercentage = paintData.paintedArea / paintData.totalArea;
            if (paintPercentage > 0.1f && paintedMaterial != null)
            {
                renderer.material = paintedMaterial;

                // Tint the material with paint color
                var materialInstance = renderer.material;
                if (materialInstance.HasProperty("_Color"))
                {
                    materialInstance.color = Color.Lerp(Color.white, paintColor, paintPercentage * 0.8f);
                }
            }
        }

        #endregion

        #region Coverage Calculation

        public float GetPaintCoverage()
        {
            if (totalPaintableArea <= 0)
                return 0f;

            UpdatePaintCoverage();
            return (totalPaintedArea / totalPaintableArea) * 100f;
        }

        private void UpdatePaintCoverage()
        {
            totalPaintedArea = 0f;

            foreach (var paintData in paintedObjects.Values)
            {
                totalPaintedArea += paintData.paintedArea;
            }
        }

        public Dictionary<string, float> GetDetailedCoverage()
        {
            var coverage = new Dictionary<string, float>();

            foreach (var kvp in paintedObjects)
            {
                var renderer = kvp.Key;
                var paintData = kvp.Value;

                if (renderer != null)
                {
                    float percentage = paintData.totalArea > 0 ?
                        (paintData.paintedArea / paintData.totalArea) * 100f : 0f;

                    coverage[renderer.name] = percentage;
                }
            }

            return coverage;
        }

        #endregion

        #region Validation and Utility

        private bool IsValidPaintPosition(Vector3 position)
        {
            // Check if position is within level bounds
            var gameManager = FindObjectOfType<GameManager>();
            if (gameManager != null)
            {
                if (Mathf.Abs(position.x) > gameManager.levelWidth / 2 ||
                    Mathf.Abs(position.y) > gameManager.levelHeight / 2)
                {
                    return false;
                }
            }

            // Check for obstacles
            var hit = Physics2D.OverlapCircle(position, 0.1f, obstacleLayer);
            if (hit != null)
            {
                return false;
            }

            return true;
        }

        private bool IsWithinPaintRadius(Vector3 paintPosition, Renderer renderer)
        {
            if (renderer == null)
                return false;

            float distance = Vector3.Distance(paintPosition, renderer.bounds.center);
            return distance <= paintRadius + renderer.bounds.extents.magnitude;
        }

        private float CalculateObjectArea(Renderer renderer)
        {
            if (renderer == null)
                return 0f;

            // Simple area calculation based on bounds
            var bounds = renderer.bounds;
            return bounds.size.x * bounds.size.y;
        }

        #endregion

        #region Visual Effects

        private void CreatePaintEffects(Vector3 position, Color color)
        {
            // Paint splat effect
            CreatePaintSplat(position, color);

            // Particle effect
            if (paintParticles != null)
            {
                var emission = paintParticles.emission;
                var colorModule = paintParticles.colorOverLifetime;

                paintParticles.transform.position = position;

                // Set particle color
                var gradient = new Gradient();
                gradient.SetKeys(
                    new GradientColorKey[] { new GradientColorKey(color, 0.0f), new GradientColorKey(color, 1.0f) },
                    new GradientAlphaKey[] { new GradientAlphaKey(1.0f, 0.0f), new GradientAlphaKey(0.0f, 1.0f) }
                );
                colorModule.color = gradient;

                paintParticles.Emit(Random.Range(10, 20));
            }
        }

        private void CreatePaintSplat(Vector3 position, Color color)
        {
            GameObject splat = GetPaintSplatFromPool();
            if (splat != null)
            {
                splat.transform.position = position;
                splat.transform.rotation = Quaternion.Euler(0, 0, Random.Range(0, 360));
                splat.SetActive(true);

                // Set splat color
                var renderer = splat.GetComponent<SpriteRenderer>();
                if (renderer != null)
                {
                    renderer.color = color;
                }

                // Auto-return to pool after delay
                StartCoroutine(ReturnSplatToPool(splat, 2f));
            }
        }

        private GameObject GetPaintSplatFromPool()
        {
            if (paintSplatPool.Count > 0)
            {
                return paintSplatPool.Dequeue();
            }

            // Create new if pool is empty
            if (paintSplatPrefab != null)
            {
                return Instantiate(paintSplatPrefab);
            }

            return null;
        }

        private IEnumerator ReturnSplatToPool(GameObject splat, float delay)
        {
            yield return new WaitForSeconds(delay);

            if (splat != null)
            {
                splat.SetActive(false);
                paintSplatPool.Enqueue(splat);
            }
        }

        #endregion

        #region Public API

        public bool CanPaint()
        {
            var gameManager = FindObjectOfType<GameManager>();
            return gameManager != null && gameManager.CanShootPaint();
        }

        public Color GetRandomPaintColor()
        {
            if (availableColors.Length > 0)
            {
                return availableColors[Random.Range(0, availableColors.Length)];
            }
            return Color.cyan;
        }

        public void ResetPaint()
        {
            foreach (var kvp in paintedObjects)
            {
                var renderer = kvp.Key;
                var paintData = kvp.Value;

                if (renderer != null)
                {
                    renderer.material = paintData.originalMaterial;
                }

                paintData.paintedArea = 0f;
                paintData.paintPoints.Clear();
            }

            totalPaintedArea = 0f;
        }

        public List<Vector2> GetPaintPointsForObject(Renderer renderer)
        {
            if (paintedObjects.TryGetValue(renderer, out PaintData paintData))
            {
                return new List<Vector2>(paintData.paintPoints);
            }
            return new List<Vector2>();
        }

        #endregion

        #region Debug

        private void OnDrawGizmos()
        {
            // Draw paint radius
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(transform.position, paintRadius);

            // Draw max paint distance
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, maxPaintDistance);
        }

        #endregion
    }

    #region Data Classes

    [System.Serializable]
    public class PaintData
    {
        public Renderer renderer;
        public Material originalMaterial;
        public float paintedArea;
        public float totalArea;
        public List<Vector2> paintPoints;
    }

    #endregion
}
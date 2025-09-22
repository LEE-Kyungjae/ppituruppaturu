using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using PittuRu.Core;

namespace PittuRu.Game
{
    public class PaintSystem : MonoBehaviour, IGameSystem
    {
        [Header("Paint Settings")]
        [SerializeField] private Material paintMaterial;
        [SerializeField] private Color paintColor = Color.red;
        [SerializeField] private float paintRadius = 1f;
        [SerializeField] private int maxPaintShots = 50;
        [SerializeField] private LayerMask paintableLayer = 256;

        [Header("Coverage Settings")]
        [SerializeField] private float targetCoverage = 80f;
        [SerializeField] private int coverageResolution = 256;

        private List<PaintSplat> _paintSplats = new List<PaintSplat>();
        private Dictionary<Renderer, RenderTexture> _paintTextures = new Dictionary<Renderer, RenderTexture>();
        private Dictionary<Renderer, Material> _originalMaterials = new Dictionary<Renderer, Material>();

        public int RemainingShots { get; private set; }
        public int TotalShots => maxPaintShots;
        public int UsedShots => maxPaintShots - RemainingShots;

        [System.Serializable]
        public class PaintSplat
        {
            public Vector3 position;
            public Vector3 normal;
            public float radius;
            public Color color;
            public float timestamp;
            public Renderer targetRenderer;

            public PaintSplat(Vector3 pos, Vector3 norm, float rad, Color col, Renderer renderer)
            {
                position = pos;
                normal = norm;
                radius = rad;
                color = col;
                timestamp = Time.time;
                targetRenderer = renderer;
            }
        }

        public void Initialize(GameConfig config)
        {
            if (config != null)
            {
                paintRadius = config.paintRadius;
                maxPaintShots = config.maxPaintShots;
                paintableLayer = config.paintableLayer;
            }

            RemainingShots = maxPaintShots;
            SetupPaintableObjects();

            Debug.Log($"[PaintSystem] Initialized - Max shots: {maxPaintShots}, Paint radius: {paintRadius}");
        }

        public void UpdateGameState(float deltaTime)
        {
            // Update paint system state if needed
            UpdatePaintEffects(deltaTime);
        }

        public void Cleanup()
        {
            // Restore original materials
            foreach (var kvp in _originalMaterials)
            {
                if (kvp.Key != null)
                {
                    kvp.Key.material = kvp.Value;
                }
            }

            // Clean up render textures
            foreach (var texture in _paintTextures.Values)
            {
                if (texture != null)
                {
                    texture.Release();
                }
            }

            _paintSplats.Clear();
            _paintTextures.Clear();
            _originalMaterials.Clear();

            Debug.Log("[PaintSystem] Cleaned up");
        }

        private void SetupPaintableObjects()
        {
            // Find all paintable objects in the scene
            GameObject[] paintableObjects = GameObject.FindGameObjectsWithTag("Paintable");

            foreach (GameObject obj in paintableObjects)
            {
                Renderer renderer = obj.GetComponent<Renderer>();
                if (renderer != null)
                {
                    SetupPaintableRenderer(renderer);
                }
            }

            Debug.Log($"[PaintSystem] Setup {paintableObjects.Length} paintable objects");
        }

        private void SetupPaintableRenderer(Renderer renderer)
        {
            // Store original material
            if (!_originalMaterials.ContainsKey(renderer))
            {
                _originalMaterials[renderer] = renderer.material;
            }

            // Create render texture for paint
            RenderTexture paintTexture = new RenderTexture(coverageResolution, coverageResolution, 0, RenderTextureFormat.ARGB32);
            paintTexture.Create();
            _paintTextures[renderer] = paintTexture;

            // Create new material with paint texture
            Material paintMat = new Material(paintMaterial);
            paintMat.SetTexture("_PaintTexture", paintTexture);
            paintMat.SetTexture("_MainTex", _originalMaterials[renderer].mainTexture);
            renderer.material = paintMat;
        }

        public void OnPaintShot()
        {
            if (RemainingShots > 0)
            {
                RemainingShots--;
                Debug.Log($"[PaintSystem] Paint shot fired - Remaining: {RemainingShots}");

                // Update UI
                GameManager.Instance?.SetGameData("remaining_shots", RemainingShots);
            }
        }

        public bool AddPaintSplat(Vector3 worldPosition, Vector3 normal, Renderer targetRenderer)
        {
            if (RemainingShots <= 0)
                return false;

            // Create paint splat
            PaintSplat splat = new PaintSplat(worldPosition, normal, paintRadius, paintColor, targetRenderer);
            _paintSplats.Add(splat);

            // Apply paint to renderer
            if (targetRenderer != null && _paintTextures.ContainsKey(targetRenderer))
            {
                ApplyPaintToRenderer(splat, targetRenderer);
            }

            // Calculate score based on new coverage
            int points = CalculatePaintPoints(splat);
            GameManager.Instance?.AddScore(points);

            Debug.Log($"[PaintSystem] Paint splat added at {worldPosition}, Points: {points}");
            return true;
        }

        private void ApplyPaintToRenderer(PaintSplat splat, Renderer renderer)
        {
            if (!_paintTextures.ContainsKey(renderer))
                return;

            RenderTexture paintTexture = _paintTextures[renderer];

            // Convert world position to UV coordinates
            Vector2 uv = GetUVFromWorldPosition(splat.position, renderer);

            // Render paint circle to texture
            RenderTexture.active = paintTexture;

            // Use Graphics.Blit or custom shader to paint
            // For now, use simple approach
            Graphics.SetRenderTarget(paintTexture);

            // Draw paint circle at UV position
            DrawPaintCircle(uv, splat.radius, splat.color);

            RenderTexture.active = null;
        }

        private Vector2 GetUVFromWorldPosition(Vector3 worldPos, Renderer renderer)
        {
            // Get the mesh and transform
            MeshFilter meshFilter = renderer.GetComponent<MeshFilter>();
            if (meshFilter == null)
                return Vector2.zero;

            // Convert world position to local position
            Vector3 localPos = renderer.transform.InverseTransformPoint(worldPos);

            // Find closest point on mesh and get UV
            // This is a simplified approach - in practice, you'd use raycasting
            Bounds bounds = meshFilter.mesh.bounds;
            Vector2 uv = new Vector2(
                (localPos.x - bounds.min.x) / bounds.size.x,
                (localPos.z - bounds.min.z) / bounds.size.z
            );

            return Vector2.Clamp01(uv);
        }

        private void DrawPaintCircle(Vector2 center, float radius, Color color)
        {
            // This would typically use a custom shader or compute shader
            // For now, we'll simulate the effect

            // In a real implementation, you'd:
            // 1. Create a temporary render texture
            // 2. Use a circle shader to draw at the UV position
            // 3. Blend it with the existing paint texture
        }

        private int CalculatePaintPoints(PaintSplat splat)
        {
            // Base points for hitting target
            int basePoints = 10;

            // Bonus for accuracy (closer to center of paintable object)
            float accuracyBonus = CalculateAccuracyBonus(splat);

            // Bonus for coverage increase
            float coverageBonus = CalculateCoverageBonus(splat);

            return Mathf.RoundToInt(basePoints + accuracyBonus + coverageBonus);
        }

        private float CalculateAccuracyBonus(PaintSplat splat)
        {
            // Calculate distance from center of target
            // For now, return a fixed bonus
            return 5f;
        }

        private float CalculateCoverageBonus(PaintSplat splat)
        {
            // Calculate how much new area this splat covers
            // For now, return a fixed bonus
            return 3f;
        }

        public float GetCoveragePercentage()
        {
            if (_paintSplats.Count == 0)
                return 0f;

            // Calculate total painted area vs total paintable area
            float totalPaintableArea = CalculateTotalPaintableArea();
            float paintedArea = CalculatePaintedArea();

            return (paintedArea / totalPaintableArea) * 100f;
        }

        private float CalculateTotalPaintableArea()
        {
            float totalArea = 0f;

            foreach (var renderer in _originalMaterials.Keys)
            {
                if (renderer != null)
                {
                    MeshFilter meshFilter = renderer.GetComponent<MeshFilter>();
                    if (meshFilter != null && meshFilter.mesh != null)
                    {
                        // Approximate surface area calculation
                        Bounds bounds = meshFilter.mesh.bounds;
                        totalArea += bounds.size.x * bounds.size.z; // Top surface area
                    }
                }
            }

            return totalArea;
        }

        private float CalculatePaintedArea()
        {
            float paintedArea = 0f;

            foreach (var splat in _paintSplats)
            {
                // Calculate circle area
                float circleArea = Mathf.PI * splat.radius * splat.radius;
                paintedArea += circleArea;
            }

            // Account for overlapping (simplified)
            return paintedArea * 0.8f; // Assume 20% overlap
        }

        private void UpdatePaintEffects(float deltaTime)
        {
            // Update any animated paint effects
            // For example, paint drying, spreading, etc.
        }

        public void ResetPaint()
        {
            _paintSplats.Clear();
            RemainingShots = maxPaintShots;

            // Clear all paint textures
            foreach (var paintTexture in _paintTextures.Values)
            {
                if (paintTexture != null)
                {
                    RenderTexture.active = paintTexture;
                    GL.Clear(true, true, Color.clear);
                    RenderTexture.active = null;
                }
            }

            Debug.Log("[PaintSystem] Paint reset");
        }

        public List<PaintSplat> GetPaintSplats()
        {
            return new List<PaintSplat>(_paintSplats);
        }

        public Color GetPaintColor()
        {
            return paintColor;
        }

        public void SetPaintColor(Color color)
        {
            paintColor = color;
            Debug.Log($"[PaintSystem] Paint color changed to {color}");
        }

        private void OnDrawGizmos()
        {
            // Draw paint splats as gizmos
            Gizmos.color = paintColor;
            foreach (var splat in _paintSplats)
            {
                Gizmos.DrawWireSphere(splat.position, splat.radius);
            }
        }

        // Unity lifecycle
        private void Start()
        {
            if (GameManager.Instance != null)
            {
                Initialize(null);
            }
        }

        private void OnDestroy()
        {
            Cleanup();
        }
    }
}
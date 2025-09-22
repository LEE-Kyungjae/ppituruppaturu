using UnityEngine;
using PittuRu.Core;

namespace PittuRu.Game
{
    public class PaintProjectile : MonoBehaviour
    {
        [Header("Projectile Settings")]
        [SerializeField] private float lifetime = 5f;
        [SerializeField] private float paintRadius = 1f;
        [SerializeField] private LayerMask paintableLayer = 256;
        [SerializeField] private bool destroyOnHit = true;

        [Header("Visual Effects")]
        [SerializeField] private GameObject hitEffect;
        [SerializeField] private TrailRenderer trail;
        [SerializeField] private ParticleSystem particles;

        [Header("Audio")]
        [SerializeField] private AudioClip shootSound;
        [SerializeField] private AudioClip hitSound;

        private Rigidbody _rigidbody;
        private Collider _collider;
        private AudioSource _audioSource;
        private bool _hasHit = false;
        private float _spawnTime;

        public Color PaintColor { get; set; } = Color.red;
        public float PaintRadius => paintRadius;

        private void Awake()
        {
            InitializeComponents();
            _spawnTime = Time.time;
        }

        private void Start()
        {
            PlayShootSound();
            SetupVisualEffects();

            // Destroy after lifetime
            Destroy(gameObject, lifetime);
        }

        private void InitializeComponents()
        {
            _rigidbody = GetComponent<Rigidbody>();
            _collider = GetComponent<Collider>();
            _audioSource = GetComponent<AudioSource>();

            // Add components if missing
            if (_rigidbody == null)
            {
                _rigidbody = gameObject.AddComponent<Rigidbody>();
                _rigidbody.mass = 0.1f;
                _rigidbody.drag = 0.1f;
            }

            if (_collider == null)
            {
                SphereCollider sphere = gameObject.AddComponent<SphereCollider>();
                sphere.radius = 0.05f;
                sphere.isTrigger = false;
            }

            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
                _audioSource.spatialBlend = 1f; // 3D sound
                _audioSource.volume = 0.3f;
            }
        }

        private void SetupVisualEffects()
        {
            // Set up trail renderer
            if (trail == null)
            {
                trail = gameObject.AddComponent<TrailRenderer>();
            }

            if (trail != null)
            {
                trail.material = CreateTrailMaterial();
                trail.startWidth = 0.1f;
                trail.endWidth = 0.02f;
                trail.time = 0.5f;
                trail.colorGradient = CreateColorGradient();
            }

            // Set up particle system
            if (particles == null)
            {
                GameObject particleObj = new GameObject("Particles");
                particleObj.transform.SetParent(transform);
                particleObj.transform.localPosition = Vector3.zero;
                particles = particleObj.AddComponent<ParticleSystem>();
            }

            if (particles != null)
            {
                SetupParticleSystem();
            }

            // Set projectile color
            var renderer = GetComponent<Renderer>();
            if (renderer != null)
            {
                Material material = new Material(Shader.Find("Standard"));
                material.color = PaintColor;
                material.SetFloat("_Metallic", 0f);
                material.SetFloat("_Smoothness", 0.8f);
                renderer.material = material;
            }
        }

        private Material CreateTrailMaterial()
        {
            Material trailMat = new Material(Shader.Find("Sprites/Default"));
            trailMat.color = new Color(PaintColor.r, PaintColor.g, PaintColor.b, 0.7f);
            return trailMat;
        }

        private Gradient CreateColorGradient()
        {
            Gradient gradient = new Gradient();
            GradientColorKey[] colorKeys = new GradientColorKey[2];
            GradientAlphaKey[] alphaKeys = new GradientAlphaKey[2];

            colorKeys[0] = new GradientColorKey(PaintColor, 0f);
            colorKeys[1] = new GradientColorKey(PaintColor, 1f);

            alphaKeys[0] = new GradientAlphaKey(1f, 0f);
            alphaKeys[1] = new GradientAlphaKey(0f, 1f);

            gradient.SetKeys(colorKeys, alphaKeys);
            return gradient;
        }

        private void SetupParticleSystem()
        {
            var main = particles.main;
            main.startLifetime = 0.5f;
            main.startSpeed = 2f;
            main.startSize = 0.1f;
            main.startColor = PaintColor;
            main.maxParticles = 20;

            var emission = particles.emission;
            emission.rateOverTime = 10f;

            var shape = particles.shape;
            shape.enabled = true;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.1f;

            var velocityOverLifetime = particles.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.space = ParticleSystemSimulationSpace.Local;
        }

        private void OnCollisionEnter(Collision collision)
        {
            if (_hasHit)
                return;

            _hasHit = true;

            // Get collision info
            ContactPoint contact = collision.contacts[0];
            Vector3 hitPoint = contact.point;
            Vector3 hitNormal = contact.normal;
            GameObject hitObject = collision.gameObject;

            Debug.Log($"[PaintProjectile] Hit {hitObject.name} at {hitPoint}");

            // Check if object is paintable
            if (IsPaintable(hitObject))
            {
                ApplyPaint(hitPoint, hitNormal, hitObject);
            }

            // Create hit effect
            CreateHitEffect(hitPoint, hitNormal);

            // Play hit sound
            PlayHitSound();

            // Destroy projectile
            if (destroyOnHit)
            {
                DestroyProjectile();
            }
        }

        private bool IsPaintable(GameObject obj)
        {
            // Check layer
            int objectLayer = obj.layer;
            bool isInPaintableLayer = (paintableLayer.value & (1 << objectLayer)) != 0;

            // Check tag
            bool hasPaintableTag = obj.CompareTag("Paintable");

            return isInPaintableLayer || hasPaintableTag;
        }

        private void ApplyPaint(Vector3 hitPoint, Vector3 hitNormal, GameObject hitObject)
        {
            // Find paint system
            PaintSystem paintSystem = FindObjectOfType<PaintSystem>();
            if (paintSystem == null)
            {
                Debug.LogWarning("[PaintProjectile] No PaintSystem found in scene");
                return;
            }

            // Get renderer component
            Renderer targetRenderer = hitObject.GetComponent<Renderer>();
            if (targetRenderer == null)
            {
                Debug.LogWarning($"[PaintProjectile] No Renderer found on {hitObject.name}");
                return;
            }

            // Apply paint splat
            bool success = paintSystem.AddPaintSplat(hitPoint, hitNormal, targetRenderer);

            if (success)
            {
                Debug.Log($"[PaintProjectile] Paint applied successfully at {hitPoint}");

                // Create paint splat visual effect
                CreatePaintSplatEffect(hitPoint, hitNormal);
            }
            else
            {
                Debug.Log("[PaintProjectile] Failed to apply paint (out of shots?)");
            }
        }

        private void CreateHitEffect(Vector3 position, Vector3 normal)
        {
            if (hitEffect != null)
            {
                GameObject effect = Instantiate(hitEffect, position, Quaternion.LookRotation(normal));
                Destroy(effect, 2f);
            }

            // Create simple particle burst
            if (particles != null)
            {
                particles.transform.position = position;
                particles.transform.rotation = Quaternion.LookRotation(normal);

                var burst = particles.emission;
                burst.SetBursts(new ParticleSystem.Burst[]
                {
                    new ParticleSystem.Burst(0f, 15)
                });

                particles.Play();
            }
        }

        private void CreatePaintSplatEffect(Vector3 position, Vector3 normal)
        {
            // Create a visual paint splat decal
            GameObject splatDecal = GameObject.CreatePrimitive(PrimitiveType.Quad);
            splatDecal.name = "PaintSplat";

            // Position and orient the decal
            splatDecal.transform.position = position + normal * 0.01f; // Slightly above surface
            splatDecal.transform.rotation = Quaternion.LookRotation(-normal);
            splatDecal.transform.localScale = Vector3.one * paintRadius * 2f;

            // Create paint splat material
            Material splatMaterial = new Material(Shader.Find("Standard"));
            splatMaterial.color = PaintColor;
            splatMaterial.SetFloat("_Mode", 3f); // Transparent mode
            splatMaterial.SetFloat("_Metallic", 0f);
            splatMaterial.SetFloat("_Smoothness", 0.5f);

            // Make it slightly transparent
            Color color = PaintColor;
            color.a = 0.8f;
            splatMaterial.color = color;

            splatDecal.GetComponent<Renderer>().material = splatMaterial;

            // Remove collider
            Destroy(splatDecal.GetComponent<Collider>());

            // Add to paint system for tracking
            Debug.Log($"[PaintProjectile] Paint splat decal created at {position}");
        }

        private void PlayShootSound()
        {
            if (shootSound != null && _audioSource != null)
            {
                _audioSource.clip = shootSound;
                _audioSource.Play();
            }
        }

        private void PlayHitSound()
        {
            if (hitSound != null && _audioSource != null)
            {
                _audioSource.clip = hitSound;
                _audioSource.Play();
            }
        }

        private void DestroyProjectile()
        {
            // Disable collision and rigidbody
            if (_collider != null)
                _collider.enabled = false;

            if (_rigidbody != null)
                _rigidbody.isKinematic = true;

            // Stop trail
            if (trail != null)
                trail.emitting = false;

            // Stop particles
            if (particles != null)
                particles.Stop();

            // Destroy after a short delay to allow sound to finish
            Destroy(gameObject, 1f);
        }

        public void SetPaintColor(Color color)
        {
            PaintColor = color;

            // Update visual components
            var renderer = GetComponent<Renderer>();
            if (renderer != null && renderer.material != null)
            {
                renderer.material.color = color;
            }

            if (trail != null)
            {
                trail.colorGradient = CreateColorGradient();
            }

            if (particles != null)
            {
                var main = particles.main;
                main.startColor = color;
            }
        }

        public void SetPaintRadius(float radius)
        {
            paintRadius = radius;
        }

        private void OnDrawGizmos()
        {
            // Draw paint radius
            Gizmos.color = new Color(PaintColor.r, PaintColor.g, PaintColor.b, 0.3f);
            Gizmos.DrawSphere(transform.position, paintRadius);

            // Draw velocity direction
            if (_rigidbody != null)
            {
                Gizmos.color = Color.yellow;
                Gizmos.DrawRay(transform.position, _rigidbody.velocity.normalized * 2f);
            }
        }
    }
}
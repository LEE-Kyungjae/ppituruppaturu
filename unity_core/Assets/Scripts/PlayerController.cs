using System.Collections;
using UnityEngine;
using PittuRu.Core;

namespace PittuRu.Core
{
    /// <summary>
    /// Player controller for the cyberpunk ninja painter character
    /// Handles movement, jumping, and paint shooting mechanics
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D), typeof(Collider2D))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 5f;
        public float jumpForce = 10f;
        public float groundCheckDistance = 0.1f;
        public LayerMask groundLayer = 1;

        [Header("Paint Shooting")]
        public Transform paintGun;
        public Transform paintGunTip;
        public LineRenderer aimLine;
        public float paintRange = 10f;
        public float aimLineLength = 5f;

        [Header("Visual Effects")]
        public ParticleSystem jumpParticles;
        public ParticleSystem moveParticles;
        public Animator characterAnimator;

        [Header("Audio")]
        public AudioSource audioSource;
        public AudioClip jumpSound;
        public AudioClip paintSound;
        public AudioClip footstepSound;

        // Components
        private Rigidbody2D rb2d;
        private Collider2D col2d;
        private SpriteRenderer spriteRenderer;
        private PaintSystem paintSystem;

        // State
        private GameConfig gameConfig;
        private bool isGrounded;
        private bool facingRight = true;
        private Vector2 moveInput;
        private Vector2 aimDirection;
        private bool canMove = true;
        private float paintBombCooldown = 5f;
        private float lastPaintBombTime = -5f;
        private float paintBombCooldown = 5f;
        private float lastPaintBombTime = -5f;

        // Animation parameters
        private const string ANIM_SPEED = "Speed";
        private const string ANIM_GROUNDED = "Grounded";
        private const string ANIM_JUMP = "Jump";
        private const string ANIM_PAINT = "Paint";

        #region Unity Lifecycle

        private void Awake()
        {
            rb2d = GetComponent<Rigidbody2D>();
            col2d = GetComponent<Collider2D>();
            spriteRenderer = GetComponent<SpriteRenderer>();
            paintSystem = FindObjectOfType<PaintSystem>();

            if (audioSource == null)
            {
                audioSource = GetComponent<AudioSource>();
            }

            SetupAimLine();
        }

        private void Start()
        {
            // Apply cyberpunk material effects
            SetupCyberpunkEffects();
        }

        private void Update()
        {
            if (!canMove) return;

            HandleInput();
            UpdateAnimations();
            UpdateAimLine();
            CheckGrounded();
        }

        private void FixedUpdate()
        {
            if (!canMove) return;

            HandleMovement();
        }

        #endregion

        #region Initialization

        public void Initialize(GameConfig config)
        {
            gameConfig = config;
            moveSpeed = config.playerSpeed;
            jumpForce = config.jumpForce;
            paintRange = config.paintRange;

            // Apply gravity settings
            if (rb2d != null)
            {
                rb2d.gravityScale = Mathf.Abs(config.gravity) / 9.81f;
            }

            Debug.Log($"Player initialized - Speed: {moveSpeed}, Jump: {jumpForce}, Range: {paintRange}");
        }

        private void SetupAimLine()
        {
            if (aimLine == null)
            {
                var aimLineObject = new GameObject("AimLine");
                aimLineObject.transform.SetParent(transform);
                aimLine = aimLineObject.AddComponent<LineRenderer>();
            }

            if (aimLine != null)
            {
                aimLine.material = Resources.Load<Material>("Materials/AimLineMaterial");
                aimLine.startWidth = 0.05f;
                aimLine.endWidth = 0.02f;
                aimLine.positionCount = 2;
                aimLine.enabled = false;

                // Cyberpunk glow effect
                aimLine.color = Color.cyan;
                if (aimLine.material != null)
                {
                    aimLine.material.SetColor("_EmissionColor", Color.cyan * 2f);
                }
            }
        }

        private void SetupCyberpunkEffects()
        {
            // Add glow effect to sprite
            if (spriteRenderer != null)
            {
                var material = spriteRenderer.material;
                if (material != null && material.HasProperty("_EmissionColor"))
                {
                    material.SetColor("_EmissionColor", Color.cyan * 0.3f);
                }
            }
        }

        #endregion

        #region Input Handling

        private void HandleInput()
        {
            // Get input from Unity Input System or legacy input
            #if ENABLE_INPUT_SYSTEM
            // New Input System would go here
            HandleLegacyInput();
            #else
            HandleLegacyInput();
            #endif
        }

        private void HandleLegacyInput()
        {
            // Movement input
            moveInput.x = Input.GetAxisRaw("Horizontal");

            // Jump input
            if (Input.GetButtonDown("Jump") && isGrounded)
            {
                Jump();
            }

            // Paint shooting
            if (Input.GetMouseButtonDown(0))
            {
                Vector3 mousePosition = Camera.main.ScreenToWorldPoint(Input.mousePosition);
                mousePosition.z = 0;
                ShootPaint(mousePosition);
            }

            // Paint bomb
            if (Input.GetKeyDown(KeyCode.B) && Time.time > lastPaintBombTime + paintBombCooldown)
            {
                lastPaintBombTime = Time.time;
                Vector3 mousePosition = Camera.main.ScreenToWorldPoint(Input.mousePosition);
                mousePosition.z = 0;
                var gameManager = FindObjectOfType<GameManager>();
                if (gameManager != null)
                {
                    gameManager.UsePaintBomb(new Vector2(mousePosition.x, mousePosition.y), "#FF00FF");
                }
            }

            if (Input.GetKeyDown(KeyCode.B))
            {
                if (Time.time > lastPaintBombTime + paintBombCooldown)
                {
                    Vector3 mousePosition = Camera.main.ScreenToWorldPoint(Input.mousePosition);
                    mousePosition.z = 0;
                    var gameManager = FindObjectOfType<GameManager>();
                    if (gameManager != null)
                    {
                        gameManager.UsePaintBomb(mousePosition, paintSystem.GetRandomPaintColor().ToString());
                    }
                    lastPaintBombTime = Time.time;
                }
            }

            // Paint bomb input
            if (Input.GetKeyDown(KeyCode.B) && Time.time > lastPaintBombTime + paintBombCooldown)
            {
                lastPaintBombTime = Time.time;
                Vector3 mousePosition = Camera.main.ScreenToWorldPoint(Input.mousePosition);
                mousePosition.z = 0;
                var gameManager = FindObjectOfType<GameManager>();
                if (gameManager != null)
                {
                    gameManager.UsePaintBomb(mousePosition, "#FF00FF"); // Example color
                }
            }

            // Aim direction for aiming line
            Vector3 mousePos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
            mousePos.z = 0;
            aimDirection = (mousePos - transform.position).normalized;

            // Show/hide aim line
            if (paintGunTip != null)
            {
                bool showAimLine = paintSystem != null && paintSystem.CanPaint();
                aimLine.enabled = showAimLine;
            }
        }

        #endregion

        #region Movement

        private void HandleMovement()
        {
            // Horizontal movement
            Vector2 velocity = rb2d.velocity;
            velocity.x = moveInput.x * moveSpeed;
            rb2d.velocity = velocity;

            // Flip sprite based on movement direction
            if (moveInput.x > 0 && !facingRight)
            {
                Flip();
            }
            else if (moveInput.x < 0 && facingRight)
            {
                Flip();
            }

            // Move particles
            if (moveParticles != null)
            {
                var emission = moveParticles.emission;
                emission.enabled = isGrounded && Mathf.Abs(moveInput.x) > 0.1f;
            }

            // Footstep sound
            if (isGrounded && Mathf.Abs(moveInput.x) > 0.1f && footstepSound != null)
            {
                if (!audioSource.isPlaying || audioSource.clip != footstepSound)
                {
                    audioSource.clip = footstepSound;
                    audioSource.loop = true;
                    audioSource.Play();
                }
            }
            else if (audioSource.clip == footstepSound)
            {
                audioSource.Stop();
            }
        }

        public void Jump()
        {
            if (!isGrounded || !canMove) return;

            rb2d.velocity = new Vector2(rb2d.velocity.x, jumpForce);

            // Jump effects
            if (jumpParticles != null)
            {
                jumpParticles.Emit(10);
            }

            if (jumpSound != null && audioSource != null)
            {
                audioSource.PlayOneShot(jumpSound);
            }

            // Animation
            if (characterAnimator != null)
            {
                characterAnimator.SetTrigger(ANIM_JUMP);
            }

            Debug.Log("Player jumped");
        }

        private void Flip()
        {
            facingRight = !facingRight;
            Vector3 scale = transform.localScale;
            scale.x *= -1;
            transform.localScale = scale;

            // Flip paint gun too
            if (paintGun != null)
            {
                Vector3 gunScale = paintGun.localScale;
                gunScale.x *= -1;
                paintGun.localScale = gunScale;
            }
        }

        private void CheckGrounded()
        {
            // Raycast downward to check if grounded
            Vector2 rayOrigin = new Vector2(transform.position.x, col2d.bounds.min.y);
            RaycastHit2D hit = Physics2D.Raycast(rayOrigin, Vector2.down, groundCheckDistance, groundLayer);

            bool wasGrounded = isGrounded;
            isGrounded = hit.collider != null;

            // Landing effect
            if (!wasGrounded && isGrounded && rb2d.velocity.y <= 0)
            {
                if (jumpParticles != null)
                {
                    jumpParticles.Emit(5);
                }
            }
        }

        #endregion

        #region Paint Shooting

        public void ShootPaint(Vector3 targetPosition)
        {
            if (paintSystem == null || !paintSystem.CanPaint())
            {
                Debug.Log("Cannot shoot paint");
                return;
            }

            Vector3 paintPosition = transform.position;
            if (paintGunTip != null)
            {
                paintPosition = paintGunTip.position;
            }

            // Check range
            float distance = Vector3.Distance(paintPosition, targetPosition);
            if (distance > paintRange)
            {
                // Clamp to max range
                Vector3 direction = (targetPosition - paintPosition).normalized;
                targetPosition = paintPosition + direction * paintRange;
            }

            // Apply paint
            Vector2 paintPos2D = new Vector2(targetPosition.x, targetPosition.y);
            bool success = paintSystem.ApplyPaint(paintPos2D);

            if (success)
            {
                // Visual effects
                CreatePaintTrail(paintPosition, targetPosition);

                // Audio
                if (paintSound != null && audioSource != null)
                {
                    audioSource.PlayOneShot(paintSound);
                }

                // Animation
                if (characterAnimator != null)
                {
                    characterAnimator.SetTrigger(ANIM_PAINT);
                }

                Debug.Log($"Paint shot at {targetPosition}");
            }
        }

        private void CreatePaintTrail(Vector3 startPos, Vector3 endPos)
        {
            // Create a temporary line renderer for paint trail effect
            var trailObject = new GameObject("PaintTrail");
            var trailRenderer = trailObject.AddComponent<LineRenderer>();

            trailRenderer.material = Resources.Load<Material>("Materials/PaintTrailMaterial");
            trailRenderer.startWidth = 0.1f;
            trailRenderer.endWidth = 0.05f;
            trailRenderer.positionCount = 2;
            trailRenderer.SetPosition(0, startPos);
            trailRenderer.SetPosition(1, endPos);

            // Cyberpunk glow
            Color paintColor = paintSystem.GetRandomPaintColor();
            trailRenderer.color = paintColor;
            if (trailRenderer.material != null)
            {
                trailRenderer.material.SetColor("_EmissionColor", paintColor * 2f);
            }

            // Auto-destroy after short duration
            Destroy(trailObject, 0.2f);
        }

        #endregion

        #region Aim Line

        private void UpdateAimLine()
        {
            if (aimLine == null || !aimLine.enabled || paintGunTip == null)
                return;

            Vector3 startPos = paintGunTip.position;
            Vector3 endPos = startPos + (Vector3)aimDirection * aimLineLength;

            // Raycast to check for obstacles
            RaycastHit2D hit = Physics2D.Raycast(startPos, aimDirection, aimLineLength);
            if (hit.collider != null)
            {
                endPos = hit.point;
            }

            aimLine.SetPosition(0, startPos);
            aimLine.SetPosition(1, endPos);

            // Color based on whether we can paint
            Color aimColor = paintSystem.CanPaint() ? Color.cyan : Color.red;
            aimLine.color = aimColor;
        }

        #endregion

        #region Animation

        private void UpdateAnimations()
        {
            if (characterAnimator == null) return;

            // Speed parameter
            float speed = Mathf.Abs(rb2d.velocity.x);
            characterAnimator.SetFloat(ANIM_SPEED, speed);

            // Grounded parameter
            characterAnimator.SetBool(ANIM_GROUNDED, isGrounded);
        }

        #endregion

        #region Public API

        public void SetPosition(Vector3 position)
        {
            transform.position = position;
            rb2d.velocity = Vector2.zero;
        }

        public void SetTargetPosition(Vector2 targetPosition)
        {
            // For Flutter input - move towards target
            Vector2 direction = (targetPosition - (Vector2)transform.position).normalized;
            moveInput.x = direction.x;

            // Auto-jump if needed to reach target
            if (isGrounded && targetPosition.y > transform.position.y + 1f)
            {
                Jump();
            }
        }

        public void SetCanMove(bool canMove)
        {
            this.canMove = canMove;
            if (!canMove)
            {
                rb2d.velocity = Vector2.zero;
                moveInput = Vector2.zero;
            }
        }

        public bool IsGrounded()
        {
            return isGrounded;
        }

        public Vector2 GetVelocity()
        {
            return rb2d.velocity;
        }

        #endregion

        #region Debug

        private void OnDrawGizmos()
        {
            // Draw ground check ray
            Vector3 rayStart = new Vector3(transform.position.x, col2d.bounds.min.y, 0);
            Gizmos.color = isGrounded ? Color.green : Color.red;
            Gizmos.DrawLine(rayStart, rayStart + Vector3.down * groundCheckDistance);

            // Draw paint range
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(transform.position, paintRange);

            // Draw aim direction
            if (Application.isPlaying)
            {
                Gizmos.color = Color.yellow;
                Gizmos.DrawLine(transform.position, transform.position + (Vector3)aimDirection * 2f);
            }
        }

        #endregion
    }
}
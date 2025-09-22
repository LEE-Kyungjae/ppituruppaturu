using UnityEngine;
using PittuRu.Core;

namespace PittuRu.Game
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float moveSpeed = 5f;
        [SerializeField] private float jumpForce = 10f;
        [SerializeField] private float mouseSensitivity = 2f;
        [SerializeField] private float verticalLookLimit = 80f;

        [Header("Physics")]
        [SerializeField] private float gravity = -9.81f;
        [SerializeField] private LayerMask groundLayer = 1;
        [SerializeField] private float groundCheckDistance = 0.1f;

        [Header("Paint Shooting")]
        [SerializeField] private GameObject paintProjectilePrefab;
        [SerializeField] private Transform shootPoint;
        [SerializeField] private float shootForce = 20f;
        [SerializeField] private float shootCooldown = 0.2f;

        private CharacterController _controller;
        private Camera _playerCamera;
        private Vector3 _velocity;
        private bool _isGrounded;
        private float _verticalRotation = 0f;
        private float _lastShootTime = 0f;

        // Input state
        private Vector2 _moveInput;
        private Vector2 _mouseInput;
        private bool _jumpInput;
        private bool _shootInput;

        public bool IsGrounded => _isGrounded;
        public Vector3 Velocity => _velocity;

        private void Start()
        {
            InitializeComponents();
            SetupCamera();

            // Lock cursor in game mode
            if (GameManager.Instance?.State == GameState.Playing)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        private void Update()
        {
            if (GameManager.Instance?.State != GameState.Playing)
                return;

            HandleInput();
            HandleMovement();
            HandleRotation();
            HandleShooting();
            CheckGrounded();
        }

        private void InitializeComponents()
        {
            _controller = GetComponent<CharacterController>();
            _playerCamera = GetComponentInChildren<Camera>();

            if (_playerCamera == null)
            {
                // Create camera if not found
                GameObject cameraObj = new GameObject("PlayerCamera");
                cameraObj.transform.SetParent(transform);
                cameraObj.transform.localPosition = new Vector3(0, 1.8f, 0);
                _playerCamera = cameraObj.AddComponent<Camera>();
                _playerCamera.tag = "MainCamera";
            }

            if (shootPoint == null)
            {
                // Create shoot point if not assigned
                GameObject shootPointObj = new GameObject("ShootPoint");
                shootPointObj.transform.SetParent(_playerCamera.transform);
                shootPointObj.transform.localPosition = new Vector3(0, -0.2f, 0.5f);
                shootPoint = shootPointObj.transform;
            }
        }

        private void SetupCamera()
        {
            if (_playerCamera != null)
            {
                _playerCamera.fieldOfView = 75f;
                _playerCamera.nearClipPlane = 0.1f;
                _playerCamera.farClipPlane = 1000f;
            }
        }

        private void HandleInput()
        {
            // Movement input
            _moveInput.x = Input.GetAxis("Horizontal");
            _moveInput.y = Input.GetAxis("Vertical");

            // Mouse input
            _mouseInput.x = Input.GetAxis("Mouse X") * mouseSensitivity;
            _mouseInput.y = Input.GetAxis("Mouse Y") * mouseSensitivity;

            // Jump input
            _jumpInput = Input.GetButtonDown("Jump");

            // Shoot input
            _shootInput = Input.GetMouseButton(0) || Input.GetButton("Fire1");

            // Pause input
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                GameManager.Instance?.PauseGame();
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }

        private void HandleMovement()
        {
            // Calculate move direction
            Vector3 moveDirection = transform.right * _moveInput.x + transform.forward * _moveInput.y;
            moveDirection.Normalize();

            // Apply movement
            Vector3 move = moveDirection * moveSpeed * Time.deltaTime;

            // Handle jumping
            if (_jumpInput && _isGrounded)
            {
                _velocity.y = Mathf.Sqrt(jumpForce * -2f * gravity);
            }

            // Apply gravity
            _velocity.y += gravity * Time.deltaTime;

            // Combine horizontal movement with vertical velocity
            move.y = _velocity.y * Time.deltaTime;

            // Move the character
            _controller.Move(move);

            // Reset vertical velocity if grounded
            if (_isGrounded && _velocity.y < 0)
            {
                _velocity.y = -2f; // Small negative value to keep grounded
            }
        }

        private void HandleRotation()
        {
            // Horizontal rotation (Y-axis)
            transform.Rotate(Vector3.up * _mouseInput.x);

            // Vertical rotation (X-axis) - camera only
            _verticalRotation -= _mouseInput.y;
            _verticalRotation = Mathf.Clamp(_verticalRotation, -verticalLookLimit, verticalLookLimit);
            _playerCamera.transform.localRotation = Quaternion.Euler(_verticalRotation, 0f, 0f);
        }

        private void HandleShooting()
        {
            if (_shootInput && Time.time >= _lastShootTime + shootCooldown)
            {
                ShootPaint();
                _lastShootTime = Time.time;
            }
        }

        private void ShootPaint()
        {
            if (paintProjectilePrefab == null || shootPoint == null)
                return;

            // Check if player has paint shots remaining
            var paintSystem = FindObjectOfType<PaintSystem>();
            if (paintSystem != null && paintSystem.RemainingShots <= 0)
                return;

            // Create paint projectile
            GameObject projectile = Instantiate(paintProjectilePrefab, shootPoint.position, shootPoint.rotation);

            // Get or add Rigidbody
            Rigidbody rb = projectile.GetComponent<Rigidbody>();
            if (rb == null)
                rb = projectile.AddComponent<Rigidbody>();

            // Apply force
            Vector3 shootDirection = _playerCamera.transform.forward;
            rb.AddForce(shootDirection * shootForce, ForceMode.Impulse);

            // Add PaintProjectile component if not present
            PaintProjectile paintProj = projectile.GetComponent<PaintProjectile>();
            if (paintProj == null)
                paintProj = projectile.AddComponent<PaintProjectile>();

            // Notify paint system
            if (paintSystem != null)
            {
                paintSystem.OnPaintShot();
            }

            Debug.Log($"[PlayerController] Paint shot fired - Direction: {shootDirection}, Force: {shootForce}");
        }

        private void CheckGrounded()
        {
            // Check if character is grounded
            Vector3 origin = transform.position + Vector3.up * 0.1f;
            _isGrounded = Physics.CheckSphere(origin, groundCheckDistance, groundLayer);

            // Alternative raycast method
            if (!_isGrounded)
            {
                Ray ray = new Ray(transform.position + Vector3.up * 0.1f, Vector3.down);
                _isGrounded = Physics.Raycast(ray, groundCheckDistance + 0.1f, groundLayer);
            }
        }

        public void SetMovementEnabled(bool enabled)
        {
            this.enabled = enabled;
        }

        public void SetPosition(Vector3 position)
        {
            _controller.enabled = false;
            transform.position = position;
            _controller.enabled = true;
        }

        public void SetRotation(Vector3 eulerAngles)
        {
            transform.rotation = Quaternion.Euler(eulerAngles);
            _verticalRotation = 0f;
            _playerCamera.transform.localRotation = Quaternion.identity;
        }

        private void OnDrawGizmosSelected()
        {
            // Draw ground check sphere
            Gizmos.color = _isGrounded ? Color.green : Color.red;
            Vector3 groundCheckPos = transform.position + Vector3.up * 0.1f;
            Gizmos.DrawWireSphere(groundCheckPos, groundCheckDistance);

            // Draw shoot direction
            if (_playerCamera != null && shootPoint != null)
            {
                Gizmos.color = Color.blue;
                Gizmos.DrawRay(shootPoint.position, _playerCamera.transform.forward * 5f);
            }
        }

        private void OnControllerColliderHit(ControllerColliderHit hit)
        {
            // Handle collision events if needed
            if (hit.gameObject.CompareTag("Paintable"))
            {
                // Player touched a paintable surface
            }
        }

        // Called when game state changes
        private void OnGameStateChanged(GameState newState)
        {
            switch (newState)
            {
                case GameState.Playing:
                    Cursor.lockState = CursorLockMode.Locked;
                    Cursor.visible = false;
                    SetMovementEnabled(true);
                    break;

                case GameState.Paused:
                case GameState.Menu:
                case GameState.GameOver:
                case GameState.Victory:
                    Cursor.lockState = CursorLockMode.None;
                    Cursor.visible = true;
                    SetMovementEnabled(false);
                    break;
            }
        }

        private void OnEnable()
        {
            if (GameManager.Instance != null)
            {
                // Subscribe to game state changes
                // GameManager.Instance.onGameStateChanged.AddListener(OnGameStateChanged);
            }
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                // Unsubscribe from game state changes
                // GameManager.Instance.onGameStateChanged.RemoveListener(OnGameStateChanged);
            }
        }
    }
}
using UnityEngine;
using System.Collections.Generic;
using System;
using System.Runtime.InteropServices;

namespace PittuRu.Bridge
{
    public static class FlutterBridge
    {
        private const string CHANNEL_NAME = "pitturu.game/unity";
        private static Dictionary<string, Action<Dictionary<string, object>>> _callbacks =
            new Dictionary<string, Action<Dictionary<string, object>>>();

#if UNITY_ANDROID && !UNITY_EDITOR
        private static AndroidJavaObject _flutterActivity;
        private static AndroidJavaObject _methodChannel;
#endif

        public static bool IsInitialized { get; private set; } = false;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Initialize()
        {
            InitializePlatformChannel();
            IsInitialized = true;
            Debug.Log("[FlutterBridge] Bridge initialized");
        }

        private static void InitializePlatformChannel()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                {
                    _flutterActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");

                    if (_flutterActivity != null)
                    {
                        // Get the method channel from Flutter activity
                        _methodChannel = _flutterActivity.Call<AndroidJavaObject>("getMethodChannel");
                        Debug.Log("[FlutterBridge] Android platform channel initialized");
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FlutterBridge] Failed to initialize Android channel: {e.Message}");
            }
#elif UNITY_IOS && !UNITY_EDITOR
            InitializeIOSBridge();
            Debug.Log("[FlutterBridge] iOS platform channel initialized");
#else
            Debug.Log("[FlutterBridge] Platform channel initialized (Editor mode)");
#endif
        }

#if UNITY_IOS && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void _sendToFlutter(string method, string jsonData);

        [DllImport("__Internal")]
        private static extern void _registerFlutterCallback(string method);

        private static void InitializeIOSBridge()
        {
            // iOS specific initialization
        }
#endif

        public static void SendToFlutter(string method, Dictionary<string, object> data)
        {
            if (!IsInitialized)
            {
                Debug.LogWarning("[FlutterBridge] Bridge not initialized, queuing message");
                return;
            }

            try
            {
                string jsonData = JsonUtility.ToJson(new SerializableDict(data));

#if UNITY_ANDROID && !UNITY_EDITOR
                SendToFlutterAndroid(method, jsonData);
#elif UNITY_IOS && !UNITY_EDITOR
                SendToFlutterIOS(method, jsonData);
#else
                SendToFlutterEditor(method, jsonData);
#endif

                Debug.Log($"[FlutterBridge] Sent to Flutter - Method: {method}, Data: {jsonData}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[FlutterBridge] Failed to send message: {e.Message}");
            }
        }

        public static void RegisterCallback(string method, Action<Dictionary<string, object>> callback)
        {
            if (_callbacks.ContainsKey(method))
            {
                _callbacks[method] = callback;
                Debug.LogWarning($"[FlutterBridge] Callback for {method} overwritten");
            }
            else
            {
                _callbacks.Add(method, callback);
                Debug.Log($"[FlutterBridge] Callback registered for {method}");
            }

#if UNITY_IOS && !UNITY_EDITOR
            _registerFlutterCallback(method);
#endif
        }

        public static void UnregisterCallback(string method)
        {
            if (_callbacks.ContainsKey(method))
            {
                _callbacks.Remove(method);
                Debug.Log($"[FlutterBridge] Callback unregistered for {method}");
            }
        }

        // Called from Flutter via platform channel
        public static void OnFlutterMessage(string method, string jsonData)
        {
            try
            {
                if (_callbacks.ContainsKey(method))
                {
                    var data = ParseJsonData(jsonData);
                    _callbacks[method]?.Invoke(data);
                    Debug.Log($"[FlutterBridge] Received from Flutter - Method: {method}, Data: {jsonData}");
                }
                else
                {
                    Debug.LogWarning($"[FlutterBridge] No callback registered for method: {method}");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FlutterBridge] Failed to process Flutter message: {e.Message}");
            }
        }

#if UNITY_ANDROID && !UNITY_EDITOR
        private static void SendToFlutterAndroid(string method, string jsonData)
        {
            if (_methodChannel != null)
            {
                _methodChannel.Call("invokeMethod", method, jsonData);
            }
            else
            {
                // Fallback to direct Unity static method call
                using (var unityClass = new AndroidJavaClass("com.pitturu.game.UnityBridge"))
                {
                    unityClass.CallStatic("sendToFlutter", method, jsonData);
                }
            }
        }
#endif

#if UNITY_IOS && !UNITY_EDITOR
        private static void SendToFlutterIOS(string method, string jsonData)
        {
            _sendToFlutter(method, jsonData);
        }
#endif

        private static void SendToFlutterEditor(string method, string jsonData)
        {
            Debug.Log($"[FlutterBridge] [EDITOR] Would send to Flutter: {method} = {jsonData}");

            // In editor, simulate some common responses for testing
            SimulateFlutterResponse(method, jsonData);
        }

        private static void SimulateFlutterResponse(string method, string jsonData)
        {
            // Simulate Flutter responses in editor for testing
            switch (method)
            {
                case "game_started":
                    // Simulate player acknowledgment
                    break;
                case "game_ended":
                    // Simulate result processing
                    break;
            }
        }

        private static Dictionary<string, object> ParseJsonData(string jsonData)
        {
            if (string.IsNullOrEmpty(jsonData))
                return new Dictionary<string, object>();

            try
            {
                var wrapper = JsonUtility.FromJson<SerializableDict>(jsonData);
                return wrapper.ToDictionary();
            }
            catch
            {
                Debug.LogError($"[FlutterBridge] Failed to parse JSON: {jsonData}");
                return new Dictionary<string, object>();
            }
        }

        // Utility classes for JSON serialization
        [Serializable]
        public class SerializableDict
        {
            public List<string> keys = new List<string>();
            public List<string> values = new List<string>();

            public SerializableDict() { }

            public SerializableDict(Dictionary<string, object> dict)
            {
                foreach (var kvp in dict)
                {
                    keys.Add(kvp.Key);
                    values.Add(kvp.Value?.ToString() ?? "");
                }
            }

            public Dictionary<string, object> ToDictionary()
            {
                var dict = new Dictionary<string, object>();
                for (int i = 0; i < keys.Count && i < values.Count; i++)
                {
                    dict[keys[i]] = values[i];
                }
                return dict;
            }
        }

        // Testing utilities
        public static void TestConnection()
        {
            var testData = new Dictionary<string, object>
            {
                ["test"] = true,
                ["timestamp"] = DateTime.Now.ToString(),
                ["unity_version"] = Application.unityVersion
            };

            SendToFlutter("unity_test", testData);
        }

        public static void SendHeartbeat()
        {
            var heartbeatData = new Dictionary<string, object>
            {
                ["timestamp"] = Time.time,
                ["frame_count"] = Time.frameCount,
                ["fps"] = (1.0f / Time.deltaTime)
            };

            SendToFlutter("unity_heartbeat", heartbeatData);
        }

        // Debug information
        public static void LogBridgeStatus()
        {
            Debug.Log($"[FlutterBridge] Status - Initialized: {IsInitialized}, Callbacks: {_callbacks.Count}");
            foreach (var callback in _callbacks.Keys)
            {
                Debug.Log($"[FlutterBridge] Registered callback: {callback}");
            }
        }
    }
}
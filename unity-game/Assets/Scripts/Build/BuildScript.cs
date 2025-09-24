using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;

namespace Pppituru.Build
{
    public class BuildScript
    {
        private const string BUILD_PATH = "Builds";
        private const string ANDROID_BUILD_PATH = BUILD_PATH + "/Android";
        private const string IOS_BUILD_PATH = BUILD_PATH + "/iOS";

        [MenuItem("Pppituru/Build/Android")]
        public static void BuildAndroid()
        {
            BuildForPlatform(BuildTarget.Android, ANDROID_BUILD_PATH);
        }

        [MenuItem("Pppituru/Build/iOS")]
        public static void BuildIOS()
        {
            BuildForPlatform(BuildTarget.iOS, IOS_BUILD_PATH);
        }

        [MenuItem("Pppituru/Build/Android for Flutter")]
        public static void BuildAndroidForFlutter()
        {
            BuildForFlutter();
        }

        public static void BuildForFlutter()
        {
            Debug.Log("[BuildScript] Starting Flutter integration build...");

            // Set build settings for Flutter integration
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            EditorUserBuildSettings.exportAsGoogleAndroidProject = true;

            // Configure player settings for Flutter
            ConfigurePlayerSettingsForFlutter();

            // Build
            string buildPath = GetCustomBuildPath();
            if (string.IsNullOrEmpty(buildPath))
            {
                buildPath = ANDROID_BUILD_PATH + "/Flutter";
            }

            BuildForPlatform(BuildTarget.Android, buildPath);

            Debug.Log($"[BuildScript] Flutter integration build completed at: {buildPath}");
        }

        private static void BuildForPlatform(BuildTarget target, string buildPath)
        {
            Debug.Log($"[BuildScript] Building for {target} at {buildPath}");

            // Ensure build directory exists
            if (!Directory.Exists(buildPath))
            {
                Directory.CreateDirectory(buildPath);
            }

            // Get scenes to build
            string[] scenes = GetScenesFromBuildSettings();

            // Configure build options
            BuildPlayerOptions buildOptions = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = GetBuildOutputPath(target, buildPath),
                target = target,
                options = GetBuildOptions(target)
            };

            // Perform build
            BuildReport report = BuildPipeline.BuildPlayer(buildOptions);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[BuildScript] Build succeeded: {summary.outputPath}");
                Debug.Log($"[BuildScript] Build size: {summary.totalSize} bytes");
                Debug.Log($"[BuildScript] Build time: {summary.totalTime}");

                // Post-build processing
                PostBuildProcessing(target, summary.outputPath);
            }
            else
            {
                Debug.LogError($"[BuildScript] Build failed with {summary.totalErrors} errors");

                // Log build errors
                foreach (BuildStep step in report.steps)
                {
                    foreach (BuildStepMessage message in step.messages)
                    {
                        if (message.type == LogType.Error || message.type == LogType.Exception)
                        {
                            Debug.LogError($"[BuildScript] {message.content}");
                        }
                    }
                }
            }
        }

        private static void ConfigurePlayerSettingsForFlutter()
        {
            Debug.Log("[BuildScript] Configuring player settings for Flutter integration...");

            // Android settings
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64 | AndroidArchitecture.ARMv7;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel21;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevelAuto;

            // Set scripting backend
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);

            // Bundle settings
            PlayerSettings.Android.useCustomKeystore = false; // Flutter will handle signing

            // Graphics settings
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.graphicsJobs = true;

            Debug.Log("[BuildScript] Player settings configured for Flutter");
        }

        private static string[] GetScenesFromBuildSettings()
        {
            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;
            string[] sceneNames = new string[scenes.Length];

            for (int i = 0; i < scenes.Length; i++)
            {
                sceneNames[i] = scenes[i].path;
            }

            return sceneNames;
        }

        private static string GetBuildOutputPath(BuildTarget target, string buildPath)
        {
            switch (target)
            {
                case BuildTarget.Android:
                    return Path.Combine(buildPath, "unityLibrary");

                case BuildTarget.iOS:
                    return Path.Combine(buildPath, "Unity-iPhone");

                default:
                    return Path.Combine(buildPath, "Build");
            }
        }

        private static BuildOptions GetBuildOptions(BuildTarget target)
        {
            BuildOptions options = BuildOptions.None;

            // Always build for development when integrating with Flutter
            options |= BuildOptions.Development;
            options |= BuildOptions.AllowDebugging;

            switch (target)
            {
                case BuildTarget.Android:
                    // Export as Gradle project for Flutter integration
                    options |= BuildOptions.AcceptExternalModificationsToPlayer;
                    break;

                case BuildTarget.iOS:
                    // Generate Xcode project for Flutter integration
                    options |= BuildOptions.AcceptExternalModificationsToPlayer;
                    break;
            }

            return options;
        }

        private static void PostBuildProcessing(BuildTarget target, string outputPath)
        {
            Debug.Log($"[BuildScript] Post-build processing for {target} at {outputPath}");

            switch (target)
            {
                case BuildTarget.Android:
                    PostBuildAndroid(outputPath);
                    break;

                case BuildTarget.iOS:
                    PostBuildIOS(outputPath);
                    break;
            }
        }

        private static void PostBuildAndroid(string outputPath)
        {
            Debug.Log("[BuildScript] Android post-build processing...");

            // Verify unityLibrary structure
            string unityLibraryPath = Path.Combine(outputPath, "unityLibrary");
            if (Directory.Exists(unityLibraryPath))
            {
                Debug.Log($"[BuildScript] ✓ unityLibrary found at: {unityLibraryPath}");

                // Check for essential files
                string[] requiredFiles = {
                    "build.gradle",
                    "src/main/AndroidManifest.xml",
                    "src/main/java",
                    "libs"
                };

                foreach (string file in requiredFiles)
                {
                    string fullPath = Path.Combine(unityLibraryPath, file);
                    if (Directory.Exists(fullPath) || File.Exists(fullPath))
                    {
                        Debug.Log($"[BuildScript] ✓ Found: {file}");
                    }
                    else
                    {
                        Debug.LogWarning($"[BuildScript] ✗ Missing: {file}");
                    }
                }

                // Create Flutter integration info file
                CreateFlutterIntegrationInfo(unityLibraryPath);
            }
            else
            {
                Debug.LogError($"[BuildScript] unityLibrary not found at: {unityLibraryPath}");
            }
        }

        private static void PostBuildIOS(string outputPath)
        {
            Debug.Log("[BuildScript] iOS post-build processing...");

            // iOS-specific post-build tasks
            // This would include Xcode project modifications for Flutter integration
        }

        private static void CreateFlutterIntegrationInfo(string outputPath)
        {
            string infoPath = Path.Combine(outputPath, "unity_integration_info.json");

            var integrationInfo = new
            {
                unity_version = Application.unityVersion,
                build_time = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                project_name = Application.productName,
                bundle_identifier = Application.identifier,
                version = Application.version,
                target_api_level = PlayerSettings.Android.targetSdkVersion.ToString(),
                min_api_level = PlayerSettings.Android.minSdkVersion.ToString(),
                scripting_backend = PlayerSettings.GetScriptingBackend(BuildTargetGroup.Android).ToString(),
                architectures = PlayerSettings.Android.targetArchitectures.ToString()
            };

            string json = JsonUtility.ToJson(integrationInfo, true);
            File.WriteAllText(infoPath, json);

            Debug.Log($"[BuildScript] Integration info created at: {infoPath}");
        }

        private static string GetCustomBuildPath()
        {
            // Check for custom build path from command line
            string[] args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-customBuildPath" && i + 1 < args.Length)
                {
                    return args[i + 1];
                }
            }
            return null;
        }

        // Command line build method
        public static void BuildFromCommandLine()
        {
            Debug.Log("[BuildScript] Starting command line build...");

            // Parse command line arguments
            string[] args = System.Environment.GetCommandLineArgs();
            BuildTarget target = BuildTarget.Android;
            string buildPath = ANDROID_BUILD_PATH;

            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "-buildTarget":
                        if (i + 1 < args.Length)
                        {
                            if (System.Enum.TryParse(args[i + 1], out BuildTarget parsedTarget))
                            {
                                target = parsedTarget;
                            }
                        }
                        break;

                    case "-customBuildPath":
                        if (i + 1 < args.Length)
                        {
                            buildPath = args[i + 1];
                        }
                        break;
                }
            }

            // Check if this is a Flutter build
            bool isFlutterBuild = System.Array.Exists(args, arg => arg.Contains("Flutter"));

            if (isFlutterBuild)
            {
                BuildForFlutter();
            }
            else
            {
                BuildForPlatform(target, buildPath);
            }
        }

        [MenuItem("Pppituru/Build/Clean Build Folder")]
        public static void CleanBuildFolder()
        {
            if (Directory.Exists(BUILD_PATH))
            {
                Directory.Delete(BUILD_PATH, true);
                Debug.Log("[BuildScript] Build folder cleaned");
            }
            else
            {
                Debug.Log("[BuildScript] Build folder already clean");
            }
        }

        [MenuItem("Pppituru/Build/Open Build Folder")]
        public static void OpenBuildFolder()
        {
            if (!Directory.Exists(BUILD_PATH))
            {
                Directory.CreateDirectory(BUILD_PATH);
            }

            EditorUtility.RevealInFinder(BUILD_PATH);
        }
    }
}
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';

class AssetGenerationService {
  final Dio _dio;

  // AI Service Configuration
  static const String _nanobananaApiKey = 'your_nanobanana_api_key';
  static const String _stabilityApiKey = 'your_stability_api_key';
  static const String _midjourneyApiKey = 'your_midjourney_api_key';

  // Asset cache
  final Map<String, GeneratedAsset> _assetCache = {};

  AssetGenerationService({required Dio dio}) : _dio = dio;

  // Generate 2D sprites and textures
  Future<GeneratedAsset?> generate2DAsset({
    required String prompt,
    AssetType type = AssetType.sprite,
    String style = 'cyberpunk',
    int width = 512,
    int height = 512,
    double quality = 0.8,
  }) async {
    try {
      final cacheKey = _generateCacheKey(prompt, type, style, width, height);

      // Check cache first
      if (_assetCache.containsKey(cacheKey)) {
        print('[AssetGen] Using cached asset for: $prompt');
        return _assetCache[cacheKey];
      }

      print('[AssetGen] Generating 2D asset: $prompt');

      GeneratedAsset? asset;

      // Try different AI services based on asset type
      switch (type) {
        case AssetType.sprite:
        case AssetType.character:
          asset = await _generateWithNanoBanana(prompt, style, width, height);
          break;

        case AssetType.background:
        case AssetType.environment:
          asset = await _generateWithStabilityAI(prompt, style, width, height);
          break;

        case AssetType.ui:
        case AssetType.icon:
          asset = await _generateWithMidjourney(prompt, style, width, height);
          break;

        default:
          asset = await _generateWithStabilityAI(prompt, style, width, height);
      }

      if (asset != null) {
        // Process and optimize the asset
        asset = await _processGeneratedAsset(asset, quality);

        // Cache the result
        _assetCache[cacheKey] = asset;

        // Save to local storage
        await _saveAssetLocally(asset);

        print('[AssetGen] Asset generated successfully: ${asset.id}');
        return asset;
      }

      return null;
    } catch (e) {
      print('[AssetGen] Failed to generate 2D asset: $e');
      return null;
    }
  }

  // Generate 3D models and meshes
  Future<Generated3DAsset?> generate3DAsset({
    required String prompt,
    Asset3DType type = Asset3DType.model,
    String style = 'low-poly',
    int polyCount = 1000,
    bool includeTextures = true,
  }) async {
    try {
      print('[AssetGen] Generating 3D asset: $prompt');

      // For 3D assets, we'll use a combination approach
      Generated3DAsset? asset;

      switch (type) {
        case Asset3DType.model:
          asset = await _generate3DModel(prompt, style, polyCount, includeTextures);
          break;

        case Asset3DType.terrain:
          asset = await _generateTerrain(prompt, style, polyCount);
          break;

        case Asset3DType.architecture:
          asset = await _generateBuilding(prompt, style, polyCount);
          break;
      }

      if (asset != null) {
        print('[AssetGen] 3D asset generated successfully: ${asset.id}');
        await _save3DAssetLocally(asset);
        return asset;
      }

      return null;
    } catch (e) {
      print('[AssetGen] Failed to generate 3D asset: $e');
      return null;
    }
  }

  // Generate sound effects and music
  Future<GeneratedAudioAsset?> generateAudioAsset({
    required String prompt,
    AudioType type = AudioType.sfx,
    double duration = 2.0,
    String mood = 'energetic',
  }) async {
    try {
      print('[AssetGen] Generating audio asset: $prompt');

      // Audio generation using AI services
      GeneratedAudioAsset? asset;

      switch (type) {
        case AudioType.sfx:
          asset = await _generateSoundEffect(prompt, duration, mood);
          break;

        case AudioType.music:
          asset = await _generateMusic(prompt, duration, mood);
          break;

        case AudioType.ambient:
          asset = await _generateAmbientSound(prompt, duration, mood);
          break;
      }

      if (asset != null) {
        print('[AssetGen] Audio asset generated successfully: ${asset.id}');
        await _saveAudioAssetLocally(asset);
        return asset;
      }

      return null;
    } catch (e) {
      print('[AssetGen] Failed to generate audio asset: $e');
      return null;
    }
  }

  // Batch asset generation for game scenes
  Future<List<GeneratedAsset>> generateSceneAssets({
    required String sceneDescription,
    required List<AssetRequest> assetRequests,
    String style = 'cyberpunk',
    Function(int, int)? onProgress,
  }) async {
    final results = <GeneratedAsset>[];

    print('[AssetGen] Generating ${assetRequests.length} assets for scene: $sceneDescription');

    for (int i = 0; i < assetRequests.length; i++) {
      final request = assetRequests[i];
      onProgress?.call(i, assetRequests.length);

      try {
        final contextualPrompt = _enhancePromptWithContext(
          request.prompt,
          sceneDescription,
          style
        );

        GeneratedAsset? asset;

        if (request.is3D) {
          asset = await generate3DAsset(
            prompt: contextualPrompt,
            type: request.asset3DType ?? Asset3DType.model,
            style: style,
          );
        } else {
          asset = await generate2DAsset(
            prompt: contextualPrompt,
            type: request.assetType ?? AssetType.sprite,
            style: style,
            width: request.width ?? 512,
            height: request.height ?? 512,
          );
        }

        if (asset != null) {
          results.add(asset);
        }
      } catch (e) {
        print('[AssetGen] Failed to generate asset ${request.prompt}: $e');
      }
    }

    onProgress?.call(assetRequests.length, assetRequests.length);
    print('[AssetGen] Scene generation completed: ${results.length}/${assetRequests.length} assets');

    return results;
  }

  // AI Service Implementations

  Future<GeneratedAsset?> _generateWithNanoBanana(
    String prompt,
    String style,
    int width,
    int height
  ) async {
    try {
      // NanoBanana API integration for sprites and characters
      final response = await _dio.post(
        'https://api.nanobanana.com/v1/generate',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_nanobananaApiKey',
            'Content-Type': 'application/json',
          },
        ),
        data: {
          'prompt': '$prompt, $style style, game asset, clean background',
          'width': width,
          'height': height,
          'steps': 30,
          'guidance_scale': 7.5,
          'format': 'png',
        },
      );

      if (response.statusCode == 200) {
        final imageData = base64Decode(response.data['image']);

        return GeneratedAsset(
          id: _generateAssetId(),
          type: AssetType.sprite,
          prompt: prompt,
          style: style,
          imageData: imageData,
          width: width,
          height: height,
          format: 'png',
          metadata: {
            'service': 'nanobanana',
            'generated_at': DateTime.now().toIso8601String(),
            'size': imageData.length,
          },
        );
      }
    } catch (e) {
      print('[AssetGen] NanoBanana generation failed: $e');
    }
    return null;
  }

  Future<GeneratedAsset?> _generateWithStabilityAI(
    String prompt,
    String style,
    int width,
    int height
  ) async {
    try {
      // Stability AI API integration for backgrounds and environments
      final response = await _dio.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_stabilityApiKey',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
        data: {
          'text_prompts': [
            {
              'text': '$prompt, $style aesthetic, game environment, high quality',
              'weight': 1.0,
            }
          ],
          'cfg_scale': 7,
          'clip_guidance_preset': 'FAST_BLUE',
          'height': height,
          'width': width,
          'samples': 1,
          'steps': 30,
        },
      );

      if (response.statusCode == 200) {
        final artifacts = response.data['artifacts'] as List;
        if (artifacts.isNotEmpty) {
          final imageData = base64Decode(artifacts[0]['base64']);

          return GeneratedAsset(
            id: _generateAssetId(),
            type: AssetType.background,
            prompt: prompt,
            style: style,
            imageData: imageData,
            width: width,
            height: height,
            format: 'png',
            metadata: {
              'service': 'stability-ai',
              'generated_at': DateTime.now().toIso8601String(),
              'size': imageData.length,
              'cfg_scale': 7,
            },
          );
        }
      }
    } catch (e) {
      print('[AssetGen] Stability AI generation failed: $e');
    }
    return null;
  }

  Future<GeneratedAsset?> _generateWithMidjourney(
    String prompt,
    String style,
    int width,
    int height
  ) async {
    try {
      // Midjourney API integration for UI and icons
      final response = await _dio.post(
        'https://api.midjourney.com/v1/imagine',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_midjourneyApiKey',
            'Content-Type': 'application/json',
          },
        ),
        data: {
          'prompt': '$prompt --style $style --ar ${width}:${height} --v 6',
          'quality': 1,
          'fast': true,
        },
      );

      if (response.statusCode == 200) {
        // Midjourney typically returns a job ID, need to poll for completion
        final jobId = response.data['job_id'];
        final imageData = await _pollMidjourneyJob(jobId);

        if (imageData != null) {
          return GeneratedAsset(
            id: _generateAssetId(),
            type: AssetType.ui,
            prompt: prompt,
            style: style,
            imageData: imageData,
            width: width,
            height: height,
            format: 'png',
            metadata: {
              'service': 'midjourney',
              'generated_at': DateTime.now().toIso8601String(),
              'job_id': jobId,
              'size': imageData.length,
            },
          );
        }
      }
    } catch (e) {
      print('[AssetGen] Midjourney generation failed: $e');
    }
    return null;
  }

  Future<Uint8List?> _pollMidjourneyJob(String jobId) async {
    // Poll Midjourney API for job completion
    for (int i = 0; i < 30; i++) {
      try {
        await Future.delayed(const Duration(seconds: 2));

        final response = await _dio.get(
          'https://api.midjourney.com/v1/jobs/$jobId',
          options: Options(
            headers: {'Authorization': 'Bearer $_midjourneyApiKey'},
          ),
        );

        if (response.data['status'] == 'completed') {
          final imageUrl = response.data['image_url'];
          final imageResponse = await _dio.get(
            imageUrl,
            options: Options(responseType: ResponseType.bytes),
          );
          return Uint8List.fromList(imageResponse.data);
        } else if (response.data['status'] == 'failed') {
          break;
        }
      } catch (e) {
        print('[AssetGen] Polling error: $e');
      }
    }
    return null;
  }

  // 3D Asset Generation
  Future<Generated3DAsset?> _generate3DModel(
    String prompt,
    String style,
    int polyCount,
    bool includeTextures
  ) async {
    // Placeholder for 3D model generation
    // This would integrate with services like:
    // - DreamFusion
    // - Point-E
    // - Shap-E
    // - Custom 3D generation APIs

    return Generated3DAsset(
      id: _generateAssetId(),
      type: Asset3DType.model,
      prompt: prompt,
      style: style,
      meshData: Uint8List(0), // Placeholder
      polyCount: polyCount,
      format: 'obj',
      textures: includeTextures ? [Uint8List(0)] : [], // Placeholder
      metadata: {
        'service': 'placeholder-3d',
        'generated_at': DateTime.now().toIso8601String(),
        'poly_count': polyCount,
      },
    );
  }

  Future<Generated3DAsset?> _generateTerrain(
    String prompt,
    String style,
    int polyCount
  ) async {
    // Terrain generation logic
    return null;
  }

  Future<Generated3DAsset?> _generateBuilding(
    String prompt,
    String style,
    int polyCount
  ) async {
    // Building generation logic
    return null;
  }

  // Audio Generation
  Future<GeneratedAudioAsset?> _generateSoundEffect(
    String prompt,
    double duration,
    String mood
  ) async {
    // Sound effect generation using AI services
    return GeneratedAudioAsset(
      id: _generateAssetId(),
      type: AudioType.sfx,
      prompt: prompt,
      mood: mood,
      audioData: Uint8List(0), // Placeholder
      duration: duration,
      format: 'wav',
      sampleRate: 44100,
      metadata: {
        'service': 'placeholder-audio',
        'generated_at': DateTime.now().toIso8601String(),
        'duration': duration,
      },
    );
  }

  Future<GeneratedAudioAsset?> _generateMusic(
    String prompt,
    double duration,
    String mood
  ) async {
    // Music generation logic
    return null;
  }

  Future<GeneratedAudioAsset?> _generateAmbientSound(
    String prompt,
    double duration,
    String mood
  ) async {
    // Ambient sound generation logic
    return null;
  }

  // Utility Methods
  Future<GeneratedAsset> _processGeneratedAsset(
    GeneratedAsset asset,
    double quality
  ) async {
    // Process and optimize the asset
    // This could include:
    // - Image compression
    // - Format conversion
    // - Color correction
    // - Size optimization

    return asset;
  }

  Future<void> _saveAssetLocally(GeneratedAsset asset) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final assetDir = Directory('${directory.path}/generated_assets');
      await assetDir.create(recursive: true);

      final file = File('${assetDir.path}/${asset.id}.${asset.format}');
      await file.writeAsBytes(asset.imageData);

      print('[AssetGen] Asset saved locally: ${file.path}');
    } catch (e) {
      print('[AssetGen] Failed to save asset locally: $e');
    }
  }

  Future<void> _save3DAssetLocally(Generated3DAsset asset) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final assetDir = Directory('${directory.path}/generated_assets/3d');
      await assetDir.create(recursive: true);

      final meshFile = File('${assetDir.path}/${asset.id}.${asset.format}');
      await meshFile.writeAsBytes(asset.meshData);

      // Save textures if available
      for (int i = 0; i < asset.textures.length; i++) {
        final textureFile = File('${assetDir.path}/${asset.id}_texture_$i.png');
        await textureFile.writeAsBytes(asset.textures[i]);
      }

      print('[AssetGen] 3D asset saved locally: ${meshFile.path}');
    } catch (e) {
      print('[AssetGen] Failed to save 3D asset locally: $e');
    }
  }

  Future<void> _saveAudioAssetLocally(GeneratedAudioAsset asset) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final assetDir = Directory('${directory.path}/generated_assets/audio');
      await assetDir.create(recursive: true);

      final file = File('${assetDir.path}/${asset.id}.${asset.format}');
      await file.writeAsBytes(asset.audioData);

      print('[AssetGen] Audio asset saved locally: ${file.path}');
    } catch (e) {
      print('[AssetGen] Failed to save audio asset locally: $e');
    }
  }

  String _generateCacheKey(
    String prompt,
    AssetType type,
    String style,
    int width,
    int height
  ) {
    final content = '$prompt-$type-$style-${width}x$height';
    return sha256.convert(utf8.encode(content)).toString();
  }

  String _generateAssetId() {
    return DateTime.now().millisecondsSinceEpoch.toString() +
           '_' +
           (1000 + (DateTime.now().microsecond % 9000)).toString();
  }

  String _enhancePromptWithContext(
    String basePrompt,
    String sceneDescription,
    String style
  ) {
    return '$basePrompt, part of $sceneDescription scene, $style aesthetic, game-ready asset';
  }

  // Clean up resources
  void dispose() {
    _assetCache.clear();
  }
}

// Data Models
class GeneratedAsset {
  final String id;
  final AssetType type;
  final String prompt;
  final String style;
  final Uint8List imageData;
  final int width;
  final int height;
  final String format;
  final Map<String, dynamic> metadata;

  GeneratedAsset({
    required this.id,
    required this.type,
    required this.prompt,
    required this.style,
    required this.imageData,
    required this.width,
    required this.height,
    required this.format,
    required this.metadata,
  });
}

class Generated3DAsset {
  final String id;
  final Asset3DType type;
  final String prompt;
  final String style;
  final Uint8List meshData;
  final int polyCount;
  final String format;
  final List<Uint8List> textures;
  final Map<String, dynamic> metadata;

  Generated3DAsset({
    required this.id,
    required this.type,
    required this.prompt,
    required this.style,
    required this.meshData,
    required this.polyCount,
    required this.format,
    required this.textures,
    required this.metadata,
  });
}

class GeneratedAudioAsset {
  final String id;
  final AudioType type;
  final String prompt;
  final String mood;
  final Uint8List audioData;
  final double duration;
  final String format;
  final int sampleRate;
  final Map<String, dynamic> metadata;

  GeneratedAudioAsset({
    required this.id,
    required this.type,
    required this.prompt,
    required this.mood,
    required this.audioData,
    required this.duration,
    required this.format,
    required this.sampleRate,
    required this.metadata,
  });
}

class AssetRequest {
  final String prompt;
  final AssetType? assetType;
  final Asset3DType? asset3DType;
  final AudioType? audioType;
  final bool is3D;
  final bool isAudio;
  final int? width;
  final int? height;
  final double? duration;

  AssetRequest({
    required this.prompt,
    this.assetType,
    this.asset3DType,
    this.audioType,
    this.is3D = false,
    this.isAudio = false,
    this.width,
    this.height,
    this.duration,
  });
}

enum AssetType {
  sprite,
  character,
  background,
  environment,
  ui,
  icon,
  texture,
  particle,
}

enum Asset3DType {
  model,
  terrain,
  architecture,
  vehicle,
  prop,
}

enum AudioType {
  sfx,
  music,
  ambient,
  voice,
}
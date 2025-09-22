using UnityEngine;
using UnityEditor;

public class SpriteImportSettings : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        TextureImporter importer = (TextureImporter)assetImporter;

        // 캐릭터 스프라이트 설정
        if (assetPath.Contains("Characters"))
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Multiple;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
        }

        // 아이콘 설정
        if (assetPath.Contains("Icons"))
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.filterMode = FilterMode.Bilinear;
            importer.maxTextureSize = 256;
        }
    }
}

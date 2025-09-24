#!/usr/bin/env python3
"""
AI Asset Generation Pipeline
Automated asset generation for the 삐뚜루빠뚜루 game using multiple AI services.
"""

import os
import sys
import json
import base64
import hashlib
import asyncio
import aiohttp
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import time

# Configuration
CONFIG = {
    'services': {
        'nanobanana': {
            'api_key': os.getenv('NANOBANANA_API_KEY', ''),
            'base_url': 'https://api.nanobanana.com/v1',
            'rate_limit': 10,  # requests per minute
        },
        'stability': {
            'api_key': os.getenv('STABILITY_API_KEY', ''),
            'base_url': 'https://api.stability.ai/v1',
            'rate_limit': 150,
        },
        'midjourney': {
            'api_key': os.getenv('MIDJOURNEY_API_KEY', ''),
            'base_url': 'https://api.midjourney.com/v1',
            'rate_limit': 5,
        },
        'elevenlabs': {
            'api_key': os.getenv('ELEVENLABS_API_KEY', ''),
            'base_url': 'https://api.elevenlabs.io/v1',
            'rate_limit': 20,
        }
    },
    'output_dirs': {
        '2d': 'assets/generated/2d',
        '3d': 'assets/generated/3d',
        'audio': 'assets/generated/audio',
        'metadata': 'assets/generated/metadata'
    },
    'formats': {
        '2d': ['png', 'jpg', 'webp'],
        '3d': ['obj', 'fbx', 'gltf'],
        'audio': ['wav', 'mp3', 'ogg']
    }
}

@dataclass
class AssetRequest:
    prompt: str
    type: str  # '2d', '3d', 'audio'
    category: str  # 'sprite', 'background', 'sfx', etc.
    style: str = 'cyberpunk'
    width: int = 512
    height: int = 512
    duration: float = 2.0
    quality: float = 0.8
    tags: List[str] = None
    metadata: Dict = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class GeneratedAsset:
    id: str
    request: AssetRequest
    file_path: str
    service_used: str
    generation_time: float
    file_size: int
    checksum: str
    metadata: Dict
    created_at: str

class AssetGenerator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.session = None
        self.generated_assets = []
        self.rate_limiters = {
            service: RateLimiter(config['rate_limit'])
            for service, config in CONFIG['services'].items()
        }

        # Create output directories
        for dir_path in CONFIG['output_dirs'].values():
            (project_root / dir_path).mkdir(parents=True, exist_ok=True)

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def generate_asset_batch(self, requests: List[AssetRequest]) -> List[GeneratedAsset]:
        """Generate a batch of assets concurrently."""
        print(f"🎨 Starting generation of {len(requests)} assets...")

        tasks = []
        for request in requests:
            task = asyncio.create_task(self.generate_single_asset(request))
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        successful_assets = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"❌ Failed to generate asset {i+1}: {result}")
            else:
                successful_assets.append(result)

        self.generated_assets.extend(successful_assets)
        return successful_assets

    async def generate_single_asset(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate a single asset using appropriate AI service."""
        start_time = time.time()

        try:
            print(f"🔄 Generating {request.type} asset: {request.prompt[:50]}...")

            if request.type == '2d':
                asset = await self._generate_2d_asset(request)
            elif request.type == '3d':
                asset = await self._generate_3d_asset(request)
            elif request.type == 'audio':
                asset = await self._generate_audio_asset(request)
            else:
                raise ValueError(f"Unknown asset type: {request.type}")

            if asset:
                generation_time = time.time() - start_time
                asset.generation_time = generation_time
                print(f"✅ Generated {asset.id} in {generation_time:.2f}s")
                return asset

        except Exception as e:
            print(f"❌ Failed to generate asset: {e}")

        return None

    async def _generate_2d_asset(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate 2D assets using appropriate AI service."""

        # Choose service based on category
        if request.category in ['sprite', 'character']:
            return await self._generate_with_nanobanana(request)
        elif request.category in ['background', 'environment']:
            return await self._generate_with_stability(request)
        elif request.category in ['ui', 'icon']:
            return await self._generate_with_midjourney(request)
        else:
            return await self._generate_with_stability(request)

    async def _generate_with_nanobanana(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate using NanoBanana API."""
        service_config = CONFIG['services']['nanobanana']

        await self.rate_limiters['nanobanana'].wait()

        payload = {
            'prompt': f"{request.prompt}, {request.style} style, game asset, clean background",
            'width': request.width,
            'height': request.height,
            'steps': 30,
            'guidance_scale': 7.5,
            'format': 'png'
        }

        headers = {
            'Authorization': f"Bearer {service_config['api_key']}",
            'Content-Type': 'application/json'
        }

        try:
            async with self.session.post(
                f"{service_config['base_url']}/generate",
                json=payload,
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    image_data = base64.b64decode(data['image'])
                    return await self._save_asset(request, image_data, 'png', 'nanobanana')
                else:
                    print(f"NanoBanana API error: {response.status}")

        except Exception as e:
            print(f"NanoBanana generation failed: {e}")

        return None

    async def _generate_with_stability(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate using Stability AI."""
        service_config = CONFIG['services']['stability']

        await self.rate_limiters['stability'].wait()

        payload = {
            'text_prompts': [{
                'text': f"{request.prompt}, {request.style} aesthetic, game environment, high quality",
                'weight': 1.0
            }],
            'cfg_scale': 7,
            'clip_guidance_preset': 'FAST_BLUE',
            'height': request.height,
            'width': request.width,
            'samples': 1,
            'steps': 30
        }

        headers = {
            'Authorization': f"Bearer {service_config['api_key']}",
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        try:
            async with self.session.post(
                f"{service_config['base_url']}/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                json=payload,
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data['artifacts']:
                        image_data = base64.b64decode(data['artifacts'][0]['base64'])
                        return await self._save_asset(request, image_data, 'png', 'stability')
                else:
                    print(f"Stability AI error: {response.status}")

        except Exception as e:
            print(f"Stability AI generation failed: {e}")

        return None

    async def _generate_with_midjourney(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate using Midjourney API."""
        service_config = CONFIG['services']['midjourney']

        await self.rate_limiters['midjourney'].wait()

        payload = {
            'prompt': f"{request.prompt} --style {request.style} --ar {request.width}:{request.height} --v 6",
            'quality': 1,
            'fast': True
        }

        headers = {
            'Authorization': f"Bearer {service_config['api_key']}",
            'Content-Type': 'application/json'
        }

        try:
            # Start generation
            async with self.session.post(
                f"{service_config['base_url']}/imagine",
                json=payload,
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    job_id = data['job_id']

                    # Poll for completion
                    image_data = await self._poll_midjourney_job(job_id, headers)
                    if image_data:
                        return await self._save_asset(request, image_data, 'png', 'midjourney')
                else:
                    print(f"Midjourney API error: {response.status}")

        except Exception as e:
            print(f"Midjourney generation failed: {e}")

        return None

    async def _poll_midjourney_job(self, job_id: str, headers: Dict) -> Optional[bytes]:
        """Poll Midjourney job until completion."""
        service_config = CONFIG['services']['midjourney']

        for _ in range(30):  # 5 minute timeout
            await asyncio.sleep(10)

            try:
                async with self.session.get(
                    f"{service_config['base_url']}/jobs/{job_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        if data['status'] == 'completed':
                            # Download image
                            async with self.session.get(data['image_url']) as img_response:
                                if img_response.status == 200:
                                    return await img_response.read()
                        elif data['status'] == 'failed':
                            print(f"Midjourney job {job_id} failed")
                            break
            except Exception as e:
                print(f"Polling error: {e}")

        return None

    async def _generate_3d_asset(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate 3D assets (placeholder for now)."""
        # This would integrate with 3D generation services like:
        # - DreamFusion
        # - Point-E
        # - Shap-E
        # For now, return a placeholder

        print(f"🚧 3D generation not yet implemented for: {request.prompt}")
        return None

    async def _generate_audio_asset(self, request: AssetRequest) -> Optional[GeneratedAsset]:
        """Generate audio assets using ElevenLabs or similar."""
        service_config = CONFIG['services']['elevenlabs']

        await self.rate_limiters['elevenlabs'].wait()

        # This is a simplified example for voice generation
        # Would need different endpoints for SFX, music, etc.
        payload = {
            'text': request.prompt,
            'voice_settings': {
                'stability': 0.5,
                'similarity_boost': 0.8
            }
        }

        headers = {
            'Authorization': f"Bearer {service_config['api_key']}",
            'Content-Type': 'application/json'
        }

        try:
            # Placeholder - would need actual audio generation API
            print(f"🚧 Audio generation not yet implemented for: {request.prompt}")
            return None

        except Exception as e:
            print(f"Audio generation failed: {e}")

        return None

    async def _save_asset(
        self,
        request: AssetRequest,
        data: bytes,
        format: str,
        service: str
    ) -> GeneratedAsset:
        """Save generated asset to disk and return metadata."""

        # Generate unique ID
        asset_id = self._generate_asset_id(request)

        # Determine output path
        output_dir = self.project_root / CONFIG['output_dirs'][request.type]
        file_path = output_dir / f"{asset_id}.{format}"

        # Save file
        with open(file_path, 'wb') as f:
            f.write(data)

        # Calculate checksum
        checksum = hashlib.sha256(data).hexdigest()

        # Create metadata
        metadata = {
            'generation_service': service,
            'original_request': asdict(request),
            'file_format': format,
            'file_size': len(data),
            'checksum': checksum,
            'created_at': datetime.now().isoformat(),
            'version': '1.0'
        }

        # Save metadata
        metadata_path = self.project_root / CONFIG['output_dirs']['metadata'] / f"{asset_id}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        return GeneratedAsset(
            id=asset_id,
            request=request,
            file_path=str(file_path),
            service_used=service,
            generation_time=0.0,  # Will be set by caller
            file_size=len(data),
            checksum=checksum,
            metadata=metadata,
            created_at=datetime.now().isoformat()
        )

    def _generate_asset_id(self, request: AssetRequest) -> str:
        """Generate unique asset ID based on request."""
        content = f"{request.prompt}-{request.type}-{request.category}-{request.style}"
        hash_input = content.encode('utf-8')
        short_hash = hashlib.md5(hash_input).hexdigest()[:8]
        timestamp = str(int(time.time()))
        return f"{request.type}_{request.category}_{short_hash}_{timestamp}"

    def save_generation_report(self, output_path: Path):
        """Save generation report with all assets."""
        report = {
            'generation_session': {
                'timestamp': datetime.now().isoformat(),
                'total_assets': len(self.generated_assets),
                'successful_generations': len([a for a in self.generated_assets if a is not None])
            },
            'assets': [asdict(asset) for asset in self.generated_assets if asset is not None]
        }

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"📊 Generation report saved to: {output_path}")

class RateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.requests = []

    async def wait(self):
        now = time.time()

        # Remove requests older than 1 minute
        self.requests = [req_time for req_time in self.requests if now - req_time < 60]

        # Check if we need to wait
        if len(self.requests) >= self.requests_per_minute:
            wait_time = 60 - (now - self.requests[0])
            if wait_time > 0:
                print(f"⏳ Rate limiting: waiting {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)

        self.requests.append(now)

async def load_asset_requests(config_file: Path) -> List[AssetRequest]:
    """Load asset requests from configuration file."""
    try:
        with open(config_file, 'r') as f:
            data = json.load(f)

        requests = []
        for item in data.get('assets', []):
            request = AssetRequest(**item)
            requests.append(request)

        return requests

    except Exception as e:
        print(f"❌ Failed to load asset requests: {e}")
        return []

async def main():
    parser = argparse.ArgumentParser(description='AI Asset Generation Pipeline')
    parser.add_argument('--config', type=str, required=True, help='Asset configuration file')
    parser.add_argument('--project-root', type=str, default='.', help='Project root directory')
    parser.add_argument('--output-report', type=str, help='Output report file path')

    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    config_file = Path(args.config)

    if not config_file.exists():
        print(f"❌ Configuration file not found: {config_file}")
        sys.exit(1)

    # Load asset requests
    asset_requests = await load_asset_requests(config_file)
    if not asset_requests:
        print("❌ No valid asset requests found")
        sys.exit(1)

    print(f"🚀 Starting asset generation pipeline...")
    print(f"📁 Project root: {project_root}")
    print(f"📄 Config file: {config_file}")
    print(f"🎨 Assets to generate: {len(asset_requests)}")

    # Generate assets
    async with AssetGenerator(project_root) as generator:
        generated_assets = await generator.generate_asset_batch(asset_requests)

        # Save report
        if args.output_report:
            report_path = Path(args.output_report)
        else:
            report_path = project_root / 'assets' / 'generated' / 'generation_report.json'

        generator.save_generation_report(report_path)

    print(f"✅ Asset generation completed!")
    print(f"📈 Generated {len(generated_assets)} assets successfully")

if __name__ == '__main__':
    asyncio.run(main())
import { Howl, Howler } from 'howler'
import { AudioConfig } from './types'

interface AudioAsset {
  id: string
  src: string[]
  volume?: number
  loop?: boolean
  preload?: boolean
}

export class AudioManager {
  private sounds: Map<string, Howl> = new Map()
  private currentMusic: Howl | null = null
  private config: AudioConfig

  constructor() {
    this.config = {
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      enableSpatial: true,
      enableDynamicAudio: false
    }
  }

  async initialize(): Promise<void> {
    try {
      // Howler 전역 설정
      Howler.volume(this.config.masterVolume)

      // 기본 사운드 에셋 로드
      await this.loadDefaultAssets()

      console.log('AudioManager 초기화 완료')
    } catch (error) {
      console.error('AudioManager 초기화 실패:', error)
      throw error
    }
  }

  private async loadDefaultAssets(): Promise<void> {
    const defaultAssets: AudioAsset[] = [
      // UI 사운드
      {
        id: 'ui_click',
        src: ['/audio/ui/click.mp3', '/audio/ui/click.webm'],
        volume: 0.6,
        preload: true
      },
      {
        id: 'ui_hover',
        src: ['/audio/ui/hover.mp3', '/audio/ui/hover.webm'],
        volume: 0.4,
        preload: true
      },
      {
        id: 'ui_success',
        src: ['/audio/ui/success.mp3', '/audio/ui/success.webm'],
        volume: 0.7,
        preload: true
      },
      {
        id: 'ui_error',
        src: ['/audio/ui/error.mp3', '/audio/ui/error.webm'],
        volume: 0.6,
        preload: true
      },

      // 게임 효과음
      {
        id: 'game_start',
        src: ['/audio/game/start.mp3', '/audio/game/start.webm'],
        volume: 0.8,
        preload: true
      },
      {
        id: 'game_end',
        src: ['/audio/game/end.mp3', '/audio/game/end.webm'],
        volume: 0.8,
        preload: true
      },
      {
        id: 'point_scored',
        src: ['/audio/game/point.mp3', '/audio/game/point.webm'],
        volume: 0.7,
        preload: true
      },
      {
        id: 'power_up',
        src: ['/audio/game/powerup.mp3', '/audio/game/powerup.webm'],
        volume: 0.8,
        preload: true
      },

      // 물리 효과음
      {
        id: 'physics_collision',
        src: ['/audio/physics/collision.mp3', '/audio/physics/collision.webm'],
        volume: 0.5,
        preload: true
      },
      {
        id: 'physics_explosion',
        src: ['/audio/physics/explosion.mp3', '/audio/physics/explosion.webm'],
        volume: 0.9,
        preload: true
      },

      // 배경음악
      {
        id: 'music_menu',
        src: ['/audio/music/menu.mp3', '/audio/music/menu.webm'],
        volume: 0.3,
        loop: true,
        preload: false
      },
      {
        id: 'music_game_battle',
        src: ['/audio/music/battle.mp3', '/audio/music/battle.webm'],
        volume: 0.4,
        loop: true,
        preload: false
      },
      {
        id: 'music_game_puzzle',
        src: ['/audio/music/puzzle.mp3', '/audio/music/puzzle.webm'],
        volume: 0.3,
        loop: true,
        preload: false
      }
    ]

    // 비동기로 사운드 로드
    await Promise.allSettled(
      defaultAssets.map(asset => this.loadSound(asset))
    )
  }

  private async loadSound(asset: AudioAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: asset.src,
        volume: (asset.volume || 1) * this.config.sfxVolume,
        loop: asset.loop || false,
        preload: asset.preload !== false,
        html5: asset.loop, // 루프 사운드는 HTML5 오디오 사용
        onload: () => {
          console.log(`사운드 로드됨: ${asset.id}`)
          resolve()
        },
        onloaderror: (id, error) => {
          console.warn(`사운드 로드 실패: ${asset.id}`, error)
          resolve() // 실패해도 계속 진행
        }
      })

      this.sounds.set(asset.id, sound)
    })
  }

  // 효과음 재생
  playSound(soundId: string, options: {
    volume?: number
    rate?: number
    seek?: number
    loop?: boolean
    fade?: { from: number, to: number, duration: number }
    spatial?: { x: number, y: number, z: number }
  } = {}): number | null {
    const sound = this.sounds.get(soundId)
    if (!sound) {
      console.warn(`사운드를 찾을 수 없습니다: ${soundId}`)
      return null
    }

    // 볼륨 설정
    if (options.volume !== undefined) {
      sound.volume(options.volume * this.config.sfxVolume)
    }

    // 재생 속도 설정
    if (options.rate !== undefined) {
      sound.rate(options.rate)
    }

    // 시작 위치 설정
    if (options.seek !== undefined) {
      sound.seek(options.seek)
    }

    // 루프 설정
    if (options.loop !== undefined) {
      sound.loop(options.loop)
    }

    // 사운드 재생
    const id = sound.play()

    // 페이드 효과
    if (options.fade) {
      sound.fade(options.fade.from, options.fade.to, options.fade.duration, id)
    }

    // 3D 공간 오디오 (WebAudio API 사용 시)
    if (options.spatial && this.config.enableSpatial) {
      sound.pos(options.spatial.x, options.spatial.y, options.spatial.z, id)
    }

    return id
  }

  // 배경음악 재생
  playMusic(musicId: string, fadeInDuration = 1000): void {
    const music = this.sounds.get(musicId)
    if (!music) {
      console.warn(`음악을 찾을 수 없습니다: ${musicId}`)
      return
    }

    // 기존 음악 페이드아웃
    if (this.currentMusic && this.currentMusic.playing()) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, 500)
      this.currentMusic.once('fade', () => {
        this.currentMusic?.stop()
      })
    }

    // 새 음악 설정 및 재생
    music.volume(0)
    music.loop(true)
    const id = music.play()

    if (id) {
      // 페이드인
      music.fade(0, this.config.musicVolume, fadeInDuration, id)
      this.currentMusic = music
    }
  }

  // 사운드 정지
  stopSound(soundId: string): void {
    const sound = this.sounds.get(soundId)
    if (sound) {
      sound.stop()
    }
  }

  // 음악 정지
  stopMusic(fadeOutDuration = 1000): void {
    if (this.currentMusic && this.currentMusic.playing()) {
      if (fadeOutDuration > 0) {
        this.currentMusic.fade(this.currentMusic.volume(), 0, fadeOutDuration)
        this.currentMusic.once('fade', () => {
          this.currentMusic?.stop()
        })
      } else {
        this.currentMusic.stop()
      }
    }
  }

  // 모든 사운드 일시정지
  pause(): void {
    this.sounds.forEach(sound => {
      if (sound.playing()) {
        sound.pause()
      }
    })
  }

  // 모든 사운드 재개
  resume(): void {
    this.sounds.forEach(sound => {
      sound.play()
    })
  }

  // 모든 사운드 정지
  stop(): void {
    this.sounds.forEach(sound => sound.stop())
    this.currentMusic = null
  }

  // 볼륨 설정
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    Howler.volume(this.config.masterVolume)
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.currentMusic) {
      this.currentMusic.volume(this.config.musicVolume)
    }
  }

  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
    // SFX 볼륨은 다음 재생시 적용됨
  }

  // 설정 업데이트
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.masterVolume !== undefined) {
      Howler.volume(this.config.masterVolume)
    }

    if (config.musicVolume !== undefined && this.currentMusic) {
      this.currentMusic.volume(this.config.musicVolume)
    }
  }

  // 현재 설정 반환
  getConfig(): AudioConfig {
    return { ...this.config }
  }

  // 사운드 추가 로드
  async loadCustomSound(asset: AudioAsset): Promise<void> {
    await this.loadSound(asset)
  }

  // 메모리 정리
  destroy(): void {
    this.stop()
    this.sounds.forEach(sound => sound.unload())
    this.sounds.clear()
    this.currentMusic = null
  }

  // 오디오 컨텍스트 활성화 (사용자 상호작용 후 호출)
  enableAudio(): void {
    Howler.ctx?.resume()
  }
}
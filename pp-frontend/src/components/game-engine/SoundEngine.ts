// 고급 사운드 엔진
export interface SoundEffect {
  id: string
  buffer: AudioBuffer
  volume: number
  loop: boolean
  pitch: number
}

export interface Music {
  id: string
  buffer: AudioBuffer
  volume: number
  loop: boolean
  fadeIn?: number
  fadeOut?: number
}

export class SoundEngine {
  private audioContext: AudioContext | null = null
  private masterGainNode: GainNode | null = null
  private musicGainNode: GainNode | null = null
  private sfxGainNode: GainNode | null = null
  private soundEffects: Map<string, SoundEffect> = new Map()
  private music: Map<string, Music> = new Map()
  private playingSounds: Map<string, AudioBufferSourceNode> = new Map()
  private currentMusic: AudioBufferSourceNode | null = null
  private currentMusicId: string | null = null
  private masterVolume: number = 1.0
  private musicVolume: number = 0.7
  private sfxVolume: number = 0.8
  private muted: boolean = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 마스터 게인 노드 생성
      this.masterGainNode = this.audioContext.createGain()
      this.masterGainNode.connect(this.audioContext.destination)
      this.masterGainNode.gain.value = this.masterVolume

      // 음악 게인 노드 생성
      this.musicGainNode = this.audioContext.createGain()
      this.musicGainNode.connect(this.masterGainNode)
      this.musicGainNode.gain.value = this.musicVolume

      // 효과음 게인 노드 생성
      this.sfxGainNode = this.audioContext.createGain()
      this.sfxGainNode.connect(this.masterGainNode)
      this.sfxGainNode.gain.value = this.sfxVolume

    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  // 오디오 컨텍스트 재개 (사용자 상호작용 필요)
  async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // 사운드 이펙트 로드
  async loadSoundEffect(id: string, url: string, options: { volume?: number, loop?: boolean, pitch?: number } = {}) {
    if (!this.audioContext) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      const soundEffect: SoundEffect = {
        id,
        buffer: audioBuffer,
        volume: options.volume ?? 1.0,
        loop: options.loop ?? false,
        pitch: options.pitch ?? 1.0
      }

      this.soundEffects.set(id, soundEffect)
    } catch (error) {
      console.error(`Failed to load sound effect ${id}:`, error)
    }
  }

  // 음악 로드
  async loadMusic(id: string, url: string, options: { volume?: number, loop?: boolean, fadeIn?: number, fadeOut?: number } = {}) {
    if (!this.audioContext) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      const music: Music = {
        id,
        buffer: audioBuffer,
        volume: options.volume ?? 1.0,
        loop: options.loop ?? true,
        fadeIn: options.fadeIn,
        fadeOut: options.fadeOut
      }

      this.music.set(id, music)
    } catch (error) {
      console.error(`Failed to load music ${id}:`, error)
    }
  }

  // 프로시저럴 사운드 생성 (간단한 톤)
  createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    const audioContext = this.audioContext
    if (!audioContext) throw new Error('Audio context not initialized')

    const sampleRate = audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      switch (type) {
        case 'sine':
          data[i] = Math.sin(2 * Math.PI * frequency * t)
          break
        case 'square':
          data[i] = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
          break
        case 'sawtooth':
          data[i] = 2 * (t * frequency - Math.floor(0.5 + t * frequency))
          break
        case 'triangle':
          data[i] = 2 * Math.abs(2 * (t * frequency - Math.floor(0.5 + t * frequency))) - 1
          break
      }
      
      // 볼륨 감쇠 (페이드 아웃)
      if (i > length * 0.8) {
        const currentValue = data[i];
        if (currentValue !== undefined) {
          data[i] = currentValue * (length - i) / (length * 0.2);
        }
      }
    }

    return buffer
  }

  // 기본 게임 사운드 생성
  generateGameSounds() {
    const audioContext = this.audioContext
    if (!audioContext) return

    // 점프 사운드
    const jumpBuffer = this.createTone(440, 0.15, 'square')
    this.soundEffects.set('jump', {
      id: 'jump',
      buffer: jumpBuffer,
      volume: 0.3,
      loop: false,
      pitch: 1.0
    })

    // 수집 사운드
    const collectBuffer = this.createTone(660, 0.2, 'sine')
    this.soundEffects.set('collect', {
      id: 'collect',
      buffer: collectBuffer,
      volume: 0.4,
      loop: false,
      pitch: 1.0
    })

    // 폭발 사운드 (노이즈 기반)
    const explosionBuffer = this.createNoiseSound(0.3, 'explosion')
    this.soundEffects.set('explosion', {
      id: 'explosion',
      buffer: explosionBuffer,
      volume: 0.5,
      loop: false,
      pitch: 1.0
    })

    // 승리 사운드
    const winBuffer = this.createMelody([523, 659, 784, 1047], [0.2, 0.2, 0.2, 0.4])
    this.soundEffects.set('win', {
      id: 'win',
      buffer: winBuffer,
      volume: 0.6,
      loop: false,
      pitch: 1.0
    })

    // 게임 오버 사운드
    const gameOverBuffer = this.createMelody([262, 233, 208, 196], [0.3, 0.3, 0.3, 0.6])
    this.soundEffects.set('gameOver', {
      id: 'gameOver',
      buffer: gameOverBuffer,
      volume: 0.5,
      loop: false,
      pitch: 1.0
    })
  }

  // 노이즈 사운드 생성 (폭발 등에 사용)
  private createNoiseSound(duration: number, type: 'explosion' | 'hit'): AudioBuffer {
    const audioContext = this.audioContext
    if (!audioContext) throw new Error('Audio context not initialized')

    const sampleRate = audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      const t = i / length
      let noise = (Math.random() * 2 - 1)
      
      if (type === 'explosion') {
        // 폭발: 높은 주파수에서 낮은 주파수로
        noise *= Math.exp(-t * 5) // 지수적 감쇠
      } else if (type === 'hit') {
        // 타격: 짧고 날카로운
        noise *= Math.exp(-t * 20)
      }
      
      data[i] = noise * (1 - t) // 전체적인 볼륨 감쇠
    }

    return buffer
  }

  // 멜로디 생성
  private createMelody(frequencies: number[], durations: number[]): AudioBuffer {
    const audioContext = this.audioContext
    if (!audioContext) throw new Error('Audio context not initialized')

    const sampleRate = audioContext.sampleRate
    const totalDuration = durations.reduce((sum, dur) => sum + dur, 0)
    const length = sampleRate * totalDuration
    const buffer = audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    let currentTime = 0
    for (let i = 0; i < frequencies.length; i++) {
      const frequency = frequencies[i]
      const duration = durations[i]
      if (typeof frequency !== 'number' || typeof duration !== 'number') {
        continue
      }
      const startSample = Math.floor(currentTime * sampleRate)
      const endSample = Math.floor((currentTime + duration) * sampleRate)

      for (let j = startSample; j < endSample && j < length; j++) {
        const t = (j - startSample) / sampleRate
        data[j] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * (1 - t / duration)
      }

      currentTime += duration
    }

    return buffer
  }

  // 사운드 이펙트 재생
  playSoundEffect(id: string, options: { volume?: number, pitch?: number, pan?: number } = {}) {
    if (!this.audioContext || !this.sfxGainNode || this.muted) return

    const soundEffect = this.soundEffects.get(id)
    if (!soundEffect) return

    try {
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()
      
      source.buffer = soundEffect.buffer
      source.loop = soundEffect.loop

      // 피치 조절
      const pitch = options.pitch ?? soundEffect.pitch
      source.playbackRate.value = pitch

      // 볼륨 조절
      const volume = (options.volume ?? soundEffect.volume) * this.sfxVolume
      gainNode.gain.value = volume

      // 패닝 (좌우 밸런스)
      if (options.pan !== undefined) {
        const panNode = this.audioContext.createStereoPanner()
        panNode.pan.value = Math.max(-1, Math.min(1, options.pan))
        source.connect(gainNode).connect(panNode).connect(this.sfxGainNode)
      } else {
        source.connect(gainNode).connect(this.sfxGainNode)
      }

      source.start(0)
      
      // 반복하지 않는 사운드는 자동으로 정리
      if (!soundEffect.loop) {
        source.addEventListener('ended', () => {
          source.disconnect()
          gainNode.disconnect()
        })
      } else {
        this.playingSounds.set(`${id}_${Date.now()}`, source)
      }

    } catch (error) {
      console.error(`Failed to play sound effect ${id}:`, error)
    }
  }

  // 음악 재생
  async playMusic(id: string, options: { fadeIn?: number, crossfade?: boolean } = {}) {
    if (!this.audioContext || !this.musicGainNode || this.muted) return

    const music = this.music.get(id)
    if (!music) return

    // 현재 재생 중인 음악이 같으면 무시
    if (this.currentMusicId === id) return

    try {
      // 기존 음악 페이드 아웃
      if (this.currentMusic && options.crossfade) {
        this.fadeOutCurrentMusic(options.fadeIn || music.fadeIn || 1.0)
      } else if (this.currentMusic) {
        this.stopMusic()
      }

      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = music.buffer
      source.loop = music.loop
      source.connect(gainNode).connect(this.musicGainNode)

      // 페이드 인
      const fadeInTime = options.fadeIn || music.fadeIn || 0
      if (fadeInTime > 0) {
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(music.volume, this.audioContext.currentTime + fadeInTime)
      } else {
        gainNode.gain.value = music.volume
      }

      source.start(0)
      this.currentMusic = source
      this.currentMusicId = id

      // 음악이 끝나면 정리 (루프가 아닌 경우)
      if (!music.loop) {
        source.addEventListener('ended', () => {
          this.currentMusic = null
          this.currentMusicId = null
          source.disconnect()
          gainNode.disconnect()
        })
      }

    } catch (error) {
      console.error(`Failed to play music ${id}:`, error)
    }
  }

  // 음악 정지
  stopMusic(fadeOut?: number) {
    if (!this.currentMusic || !this.audioContext) return

    const currentMusic = this.music.get(this.currentMusicId || '')
    const fadeOutTime = fadeOut || currentMusic?.fadeOut || 0

    if (fadeOutTime > 0) {
      this.fadeOutCurrentMusic(fadeOutTime)
    } else {
      this.currentMusic.stop()
      this.currentMusic = null
      this.currentMusicId = null
    }
  }

  private fadeOutCurrentMusic(fadeTime: number) {
    if (!this.currentMusic || !this.audioContext) return

    const gainNode = this.audioContext.createGain()
    // 기존 연결을 통해 게인 노드를 가져오는 대신, 새로운 페이드 아웃 로직 구현
    const currentTime = this.audioContext.currentTime
    
    // 현재 볼륨에서 0으로 페이드 아웃
    // 실제 구현에서는 기존 게인 노드에 접근해야 함
    setTimeout(() => {
      if (this.currentMusic) {
        this.currentMusic.stop()
        this.currentMusic = null
        this.currentMusicId = null
      }
    }, fadeTime * 1000)
  }

  // 볼륨 조절
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.muted ? 0 : this.masterVolume
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.muted ? 0 : this.musicVolume
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.muted ? 0 : this.sfxVolume
    }
  }

  // 음소거
  setMuted(muted: boolean) {
    this.muted = muted
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : this.masterVolume
    }
  }

  // 모든 사운드 정지
  stopAllSounds() {
    // 모든 재생 중인 사운드 정지
    for (const [id, source] of this.playingSounds) {
      source.stop()
      source.disconnect()
    }
    this.playingSounds.clear()

    // 음악 정지
    this.stopMusic()
  }

  // 게터
  getMasterVolume(): number { return this.masterVolume }
  getMusicVolume(): number { return this.musicVolume }
  getSfxVolume(): number { return this.sfxVolume }
  isMuted(): boolean { return this.muted }
  getCurrentMusicId(): string | null { return this.currentMusicId }
}

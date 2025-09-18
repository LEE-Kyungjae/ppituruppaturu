import { InputMapping } from './types'

export class InputManager {
  private keyStates: Map<string, boolean> = new Map()
  private mouseState = {
    x: 0,
    y: 0,
    buttons: [false, false, false] // left, middle, right
  }
  private touchState: Map<number, { x: number, y: number }> = new Map()
  private inputMapping: InputMapping
  private listeners: Map<string, Array<(event: any) => void>> = new Map()

  constructor() {
    this.inputMapping = {
      move: {
        up: ['KeyW', 'ArrowUp'],
        down: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight']
      },
      action: {
        primary: ['Space', 'Enter', 'MouseLeft'],
        secondary: ['ShiftLeft', 'ShiftRight', 'MouseRight'],
        special: ['KeyE', 'KeyF'],
        pause: ['Escape', 'KeyP']
      },
      ui: {
        menu: ['Escape', 'KeyM'],
        chat: ['KeyT', 'KeyC'],
        scoreboard: ['Tab']
      }
    }
  }

  async initialize(): Promise<void> {
    try {
      // 키보드 이벤트 리스너
      document.addEventListener('keydown', this.handleKeyDown.bind(this))
      document.addEventListener('keyup', this.handleKeyUp.bind(this))

      // 마우스 이벤트 리스너
      document.addEventListener('mousedown', this.handleMouseDown.bind(this))
      document.addEventListener('mouseup', this.handleMouseUp.bind(this))
      document.addEventListener('mousemove', this.handleMouseMove.bind(this))
      document.addEventListener('wheel', this.handleMouseWheel.bind(this))

      // 터치 이벤트 리스너 (모바일)
      document.addEventListener('touchstart', this.handleTouchStart.bind(this))
      document.addEventListener('touchmove', this.handleTouchMove.bind(this))
      document.addEventListener('touchend', this.handleTouchEnd.bind(this))

      // 포커스 관련 이벤트
      window.addEventListener('blur', this.handleWindowBlur.bind(this))
      window.addEventListener('focus', this.handleWindowFocus.bind(this))

      // 컨텍스트 메뉴 비활성화 (게임 중 우클릭 방지)
      document.addEventListener('contextmenu', (e) => e.preventDefault())

      console.log('InputManager 초기화 완료')
    } catch (error) {
      console.error('InputManager 초기화 실패:', error)
      throw error
    }
  }

  // 키보드 이벤트 처리
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return // 키 반복 무시

    const key = event.code
    this.keyStates.set(key, true)

    // 액션 매핑 확인 및 이벤트 발생
    this.checkActionMapping(key, true)

    // 기본 브라우저 동작 차단 (게임 키만)
    if (this.isGameKey(key)) {
      event.preventDefault()
    }

    this.emit('keydown', { key, event })
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code
    this.keyStates.set(key, false)

    this.checkActionMapping(key, false)

    if (this.isGameKey(key)) {
      event.preventDefault()
    }

    this.emit('keyup', { key, event })
  }

  // 마우스 이벤트 처리
  private handleMouseDown(event: MouseEvent): void {
    this.mouseState.buttons[event.button] = true

    const mouseKey = `Mouse${this.getMouseButtonName(event.button)}`
    this.checkActionMapping(mouseKey, true)

    this.emit('mousedown', {
      button: event.button,
      x: event.clientX,
      y: event.clientY,
      event
    })
  }

  private handleMouseUp(event: MouseEvent): void {
    this.mouseState.buttons[event.button] = false

    const mouseKey = `Mouse${this.getMouseButtonName(event.button)}`
    this.checkActionMapping(mouseKey, false)

    this.emit('mouseup', {
      button: event.button,
      x: event.clientX,
      y: event.clientY,
      event
    })
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mouseState.x = event.clientX
    this.mouseState.y = event.clientY

    this.emit('mousemove', {
      x: event.clientX,
      y: event.clientY,
      deltaX: event.movementX,
      deltaY: event.movementY,
      event
    })
  }

  private handleMouseWheel(event: WheelEvent): void {
    this.emit('mousewheel', {
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      event
    })

    // 게임 중 스크롤 방지
    event.preventDefault()
  }

  // 터치 이벤트 처리 (모바일)
  private handleTouchStart(event: TouchEvent): void {
    for (const touch of Array.from(event.touches)) {
      this.touchState.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      })
    }

    this.emit('touchstart', {
      touches: Array.from(event.touches),
      event
    })

    // 모바일에서 스크롤 방지
    event.preventDefault()
  }

  private handleTouchMove(event: TouchEvent): void {
    for (const touch of Array.from(event.touches)) {
      const prevTouch = this.touchState.get(touch.identifier)
      if (prevTouch) {
        this.touchState.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY
        })
      }
    }

    this.emit('touchmove', {
      touches: Array.from(event.touches),
      event
    })

    event.preventDefault()
  }

  private handleTouchEnd(event: TouchEvent): void {
    for (const touch of Array.from(event.changedTouches)) {
      this.touchState.delete(touch.identifier)
    }

    this.emit('touchend', {
      touches: Array.from(event.changedTouches),
      event
    })

    event.preventDefault()
  }

  // 윈도우 포커스 처리
  private handleWindowBlur(): void {
    // 포커스를 잃으면 모든 키 상태 리셋
    this.keyStates.clear()
    this.mouseState.buttons.fill(false)
    this.touchState.clear()

    this.emit('focus_lost', {})
  }

  private handleWindowFocus(): void {
    this.emit('focus_gained', {})
  }

  // 액션 매핑 확인
  private checkActionMapping(inputKey: string, isPressed: boolean): void {
    // 이동 액션 확인
    for (const [direction, keys] of Object.entries(this.inputMapping.move)) {
      if (keys.includes(inputKey)) {
        this.emit(`move_${direction}`, { pressed: isPressed, inputKey })
      }
    }

    // 액션 버튼 확인
    for (const [action, keys] of Object.entries(this.inputMapping.action)) {
      if (keys.includes(inputKey)) {
        this.emit(`action_${action}`, { pressed: isPressed, inputKey })
      }
    }

    // UI 액션 확인
    for (const [uiAction, keys] of Object.entries(this.inputMapping.ui)) {
      if (keys.includes(inputKey)) {
        this.emit(`ui_${uiAction}`, { pressed: isPressed, inputKey })
      }
    }
  }

  // 유틸리티 메서드들
  private getMouseButtonName(button: number): string {
    switch (button) {
      case 0: return 'Left'
      case 1: return 'Middle'
      case 2: return 'Right'
      default: return `${button}`
    }
  }

  private isGameKey(key: string): boolean {
    // 게임에서 사용하는 키인지 확인
    const allGameKeys = [
      ...this.inputMapping.move.up,
      ...this.inputMapping.move.down,
      ...this.inputMapping.move.left,
      ...this.inputMapping.move.right,
      ...this.inputMapping.action.primary,
      ...this.inputMapping.action.secondary,
      ...this.inputMapping.action.special,
      ...this.inputMapping.action.pause
    ]

    return allGameKeys.includes(key)
  }

  // 공개 API
  isKeyPressed(key: string): boolean {
    return this.keyStates.get(key) || false
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseState.buttons[button] || false
  }

  getMousePosition(): { x: number, y: number } {
    return { x: this.mouseState.x, y: this.mouseState.y }
  }

  getTouchPositions(): Array<{ id: number, x: number, y: number }> {
    return Array.from(this.touchState.entries()).map(([id, pos]) => ({
      id,
      x: pos.x,
      y: pos.y
    }))
  }

  // 액션 상태 확인
  isMovePressed(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    return this.inputMapping.move[direction].some(key => this.isKeyPressed(key))
  }

  isActionPressed(action: 'primary' | 'secondary' | 'special' | 'pause'): boolean {
    return this.inputMapping.action[action].some(key => {
      if (key.startsWith('Mouse')) {
        const button = key === 'MouseLeft' ? 0 : key === 'MouseRight' ? 2 : 1
        return this.isMouseButtonPressed(button)
      }
      return this.isKeyPressed(key)
    })
  }

  // 입력 매핑 업데이트
  updateInputMapping(mapping: Partial<InputMapping>): void {
    this.inputMapping = { ...this.inputMapping, ...mapping }
  }

  getInputMapping(): InputMapping {
    return { ...this.inputMapping }
  }

  // 이벤트 리스너 관리
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  // 메모리 정리
  destroy(): void {
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    document.removeEventListener('wheel', this.handleMouseWheel.bind(this))
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    window.removeEventListener('blur', this.handleWindowBlur.bind(this))
    window.removeEventListener('focus', this.handleWindowFocus.bind(this))

    // 상태 초기화
    this.keyStates.clear()
    this.touchState.clear()
    this.listeners.clear()
  }
}
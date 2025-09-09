// frontend/src/components/chat/EmojiStickerSystem.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface EmojiCategory {
  id: string
  name: string
  icon: string
  emojis: string[]
}

export interface StickerPack {
  id: string
  name: string
  description: string
  thumbnail: string
  isPremium: boolean
  price?: number
  stickers: Sticker[]
}

export interface Sticker {
  id: string
  name: string
  emoji: string
  animated?: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface CustomEmoji {
  id: string
  name: string
  url: string
  createdBy: string
  isPremium: boolean
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'recent',
    name: '최근 사용',
    icon: '⏰',
    emojis: ['😂', '❤️', '👍', '😭', '🔥', '😍', '🎮', '⚡']
  },
  {
    id: 'people',
    name: '사람',
    icon: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
  },
  {
    id: 'animals',
    name: '동물',
    icon: '🐱',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔']
  },
  {
    id: 'food',
    name: '음식',
    icon: '🍕',
    emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾']
  },
  {
    id: 'gaming',
    name: '게임',
    icon: '🎮',
    emojis: ['🎮', '🕹', '🎯', '🎲', '🃏', '🀄', '🎴', '🎰', '🎳', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎪', '🎨', '🎭', '🩰', '🎺', '🥁', '🎷', '🎸', '🎻', '🎹', '🎤', '🎧', '📻', '🎵', '🎶', '🎼', '🎛', '🎙', '📺', '📹', '📷', '📸', '💾', '💿', '📀', '💽', '🎬', '🎞', '📽', '🎥']
  },
  {
    id: 'objects',
    name: '사물',
    icon: '⚡',
    emojis: ['⚡', '🔥', '💧', '🌟', '✨', '💫', '⭐', '🌙', '☀️', '🌈', '☁️', '⛅', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄', '🌬', '💨', '🌪', '🌊', '💎', '💰', '🪙', '💸', '💳', '🧾', '💹', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇', '📏', '📐', '✂️', '🗃', '🗄', '🗑', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝', '🔨', '🪓', '⛏', '⚒', '🛠', '🗡', '⚔️', '🔫', '🪃', '🏹', '🛡', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜', '⚖️', '🦯', '🔗', '⛓', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡']
  },
  {
    id: 'symbols',
    name: '기호',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁‍🗨', '💬', '💭', '🗯', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
  }
]

const PREMIUM_STICKER_PACKS: StickerPack[] = [
  {
    id: 'pro_gamer',
    name: '프로 게이머 팩',
    description: '진짜 게이머들을 위한 프리미엄 스티커',
    thumbnail: '🏆',
    isPremium: true,
    price: 500,
    stickers: [
      { id: 'clutch', name: 'Clutch!', emoji: '🔥', rarity: 'legendary' },
      { id: 'ace', name: 'ACE!', emoji: '💯', rarity: 'epic' },
      { id: 'noob', name: '뉴비', emoji: '🤡', rarity: 'common' },
      { id: 'gg_ez', name: 'GG EZ', emoji: '😎', rarity: 'rare' },
      { id: 'carry', name: '캐리중', emoji: '💪', rarity: 'epic' },
      { id: 'rip', name: 'RIP', emoji: '💀', rarity: 'rare' }
    ]
  },
  {
    id: 'cute_animals',
    name: '귀여운 동물들',
    description: '사랑스러운 동물 친구들',
    thumbnail: '🐱',
    isPremium: true,
    price: 300,
    stickers: [
      { id: 'happy_cat', name: '행복한 고양이', emoji: '😺', rarity: 'common' },
      { id: 'sleepy_dog', name: '졸린 강아지', emoji: '😴', animated: true, rarity: 'rare' },
      { id: 'excited_rabbit', name: '신난 토끼', emoji: '🐰', rarity: 'common' },
      { id: 'wise_owl', name: '지혜로운 부엉이', emoji: '🦉', rarity: 'epic' }
    ]
  },
  {
    id: 'reactions',
    name: '리액션 팩',
    description: '감정 표현의 완성',
    thumbnail: '🤔',
    isPremium: false,
    stickers: [
      { id: 'thinking', name: '생각중', emoji: '🤔', rarity: 'common' },
      { id: 'facepalm', name: '어이없음', emoji: '🤦', rarity: 'common' },
      { id: 'shrug', name: '모르겠음', emoji: '🤷', rarity: 'common' },
      { id: 'mind_blown', name: '충격', emoji: '🤯', rarity: 'rare' },
      { id: 'heart_eyes', name: '반함', emoji: '😍', rarity: 'common' },
      { id: 'crying_laughing', name: '웃음참기', emoji: '😂', rarity: 'common' }
    ]
  }
]

const CUSTOM_EMOJIS: CustomEmoji[] = [
  { id: 'pog', name: ':pog:', url: '/emojis/pog.png', createdBy: 'admin', isPremium: false },
  { id: 'kappa', name: ':kappa:', url: '/emojis/kappa.png', createdBy: 'user1', isPremium: false },
  { id: 'pepega', name: ':pepega:', url: '/emojis/pepega.png', createdBy: 'mod1', isPremium: true }
]

interface EmojiStickerSystemProps {
  onEmojiSelect: (emoji: string) => void
  onStickerSelect: (stickerId: string, packId: string) => void
  onCustomEmojiSelect: (customEmoji: CustomEmoji) => void
  recentEmojis: string[]
  isVisible: boolean
  type: 'emoji' | 'sticker'
}

export const EmojiStickerSystem: React.FC<EmojiStickerSystemProps> = ({
  onEmojiSelect,
  onStickerSelect,
  onCustomEmojiSelect,
  recentEmojis,
  isVisible,
  type
}) => {
  const [activeCategory, setActiveCategory] = useState('recent')
  const [activeStickerPack, setActiveStickerPack] = useState('reactions')
  const [searchQuery, setSearchQuery] = useState('')
  const [skinTone, setSkinTone] = useState('default')

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when visible
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isVisible])

  // Filter emojis based on search query
  const filteredEmojis = useCallback((emojis: string[]) => {
    if (!searchQuery) return emojis
    // Simple search - in a real app, you'd have emoji names/tags to search
    return emojis.filter((_, index) => 
      searchQuery.length <= 2 ? true : index % 3 === 0 // Mock search
    )
  }, [searchQuery])

  // Get recent emojis with fallback
  const getRecentEmojis = () => {
    if (recentEmojis.length === 0) {
      return ['😀', '👍', '❤️', '😂', '🎉', '🔥', '💯', '✨']
    }
    return recentEmojis.slice(0, 24)
  }

  // Render emoji picker
  const EmojiPicker = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ width: '320px', height: '400px' }}
    >
      {/* Search bar */}
      <div className="p-3 border-b border-gray-700">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이모지 검색..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-gray-700 bg-gray-750">
        {EMOJI_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-1 p-2 text-center text-sm hover:bg-gray-600 transition-colors ${
              activeCategory === category.id ? 'bg-blue-600 text-white' : 'text-gray-300'
            }`}
            title={category.name}
          >
            {category.icon}
          </button>
        ))}
      </div>

      {/* Custom emojis section */}
      {activeCategory === 'recent' && CUSTOM_EMOJIS.length > 0 && (
        <div className="p-2 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-2">커스텀 이모지</div>
          <div className="grid grid-cols-8 gap-1">
            {CUSTOM_EMOJIS.map(customEmoji => (
              <motion.button
                key={customEmoji.id}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onCustomEmojiSelect(customEmoji)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-600 rounded relative"
              >
                <img 
                  src={customEmoji.url} 
                  alt={customEmoji.name}
                  className="w-6 h-6"
                />
                {customEmoji.isPremium && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-xs flex items-center justify-center">
                    ⭐
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Emojis grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {(() => {
            let emojisToShow: string[]
            
            if (activeCategory === 'recent') {
              emojisToShow = getRecentEmojis()
            } else {
              const category = EMOJI_CATEGORIES.find(c => c.id === activeCategory)
              emojisToShow = category ? filteredEmojis(category.emojis) : []
            }

            return emojisToShow.map((emoji, index) => (
              <motion.button
                key={`${emoji}-${index}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEmojiSelect(emoji)}
                className="w-8 h-8 text-lg hover:bg-gray-600 rounded transition-colors flex items-center justify-center"
              >
                {emoji}
              </motion.button>
            ))
          })()}
        </div>
      </div>

      {/* Skin tone selector (for people emojis) */}
      {activeCategory === 'people' && (
        <div className="p-2 border-t border-gray-700 bg-gray-750">
          <div className="flex justify-center gap-2">
            {['🏻', '🏼', '🏽', '🏾', '🏿'].map((tone, index) => (
              <button
                key={tone}
                onClick={() => setSkinTone(tone)}
                className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                  skinTone === tone ? 'border-blue-400' : 'border-gray-600'
                }`}
                style={{ backgroundColor: ['#FDBCB4', '#F3DFB7', '#D9B783', '#B08651', '#7C533A'][index] }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )

  // Render sticker picker
  const StickerPicker = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ width: '360px', height: '450px' }}
    >
      {/* Sticker pack tabs */}
      <div className="border-b border-gray-700 bg-gray-750">
        <div className="flex overflow-x-auto">
          {PREMIUM_STICKER_PACKS.map(pack => (
            <button
              key={pack.id}
              onClick={() => setActiveStickerPack(pack.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm hover:bg-gray-600 transition-colors relative ${
                activeStickerPack === pack.id ? 'bg-blue-600 text-white' : 'text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{pack.thumbnail}</span>
                <span>{pack.name}</span>
                {pack.isPremium && (
                  <div className="w-4 h-4 bg-yellow-400 rounded-full text-xs flex items-center justify-center text-black">
                    ⭐
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active sticker pack info */}
      {(() => {
        const activePack = PREMIUM_STICKER_PACKS.find(p => p.id === activeStickerPack)
        if (!activePack) return null

        return (
          <div className="p-3 border-b border-gray-700 bg-gray-750">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{activePack.name}</div>
                <div className="text-sm text-gray-400">{activePack.description}</div>
              </div>
              {activePack.isPremium && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  {activePack.price} 포인트
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Stickers grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {(() => {
          const activePack = PREMIUM_STICKER_PACKS.find(p => p.id === activeStickerPack)
          if (!activePack) return null

          return (
            <div className="grid grid-cols-3 gap-3">
              {activePack.stickers.map(sticker => (
                <motion.button
                  key={sticker.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStickerSelect(sticker.id, activePack.id)}
                  className="aspect-square bg-gray-700 hover:bg-gray-600 rounded-xl p-3 transition-colors relative group"
                >
                  {/* Sticker preview */}
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className={`text-3xl mb-1 ${sticker.animated ? 'animate-bounce' : ''}`}>
                      {sticker.emoji}
                    </div>
                    <div className="text-xs text-gray-300 text-center">{sticker.name}</div>
                  </div>

                  {/* Rarity indicator */}
                  <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
                    sticker.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    sticker.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                    sticker.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    'bg-gray-500'
                  }`} />

                  {/* Animated indicator */}
                  {sticker.animated && (
                    <div className="absolute bottom-1 right-1 text-xs bg-green-500 text-white px-1 rounded">
                      GIF
                    </div>
                  )}

                  {/* Hover info */}
                  <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-sm font-semibold">{sticker.name}</div>
                      <div className="text-xs capitalize">{sticker.rarity}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Purchase button for premium packs */}
      {(() => {
        const activePack = PREMIUM_STICKER_PACKS.find(p => p.id === activeStickerPack)
        if (!activePack?.isPremium) return null

        return (
          <div className="p-3 border-t border-gray-700 bg-gray-750">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              🛒 스티커 팩 구매 ({activePack.price} 포인트)
            </motion.button>
          </div>
        )
      })()}
    </motion.div>
  )

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {type === 'emoji' ? <EmojiPicker /> : <StickerPicker />}
    </AnimatePresence>
  )
}

export default EmojiStickerSystem
// frontend/src/components/chat/FileMediaSystem.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUpload {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error' | 'cancelled'
  url?: string
  thumbnail?: string
  error?: string
}

interface MediaPreview {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  name: string
  size: number
  url: string
  thumbnail?: string
  duration?: number // for video/audio
  dimensions?: { width: number; height: number }
}

interface FileMediaSystemProps {
  onFileUpload: (file: File) => void
  onMediaShare: (media: MediaPreview) => void
  allowedTypes: string[]
  maxFileSize: number // in bytes
  maxFiles: number
}

export const FileMediaSystem: React.FC<FileMediaSystemProps> = ({
  onFileUpload,
  onMediaShare,
  allowedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10
}) => {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState<MediaPreview | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `파일 크기가 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB를 초과합니다.`
    }

    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type)
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -1))
      }
      return fileType === type
    })

    if (!isAllowed) {
      return '지원하지 않는 파일 형식입니다.'
    }

    return null
  }, [allowedTypes, maxFileSize])

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    if (uploads.length + fileArray.length > maxFiles) {
      alert(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`)
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert('파일 업로드 오류:\n' + errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      startUpload(validFiles)
    }
  }, [uploads.length, maxFiles, validateFile])

  // Start file upload simulation
  const startUpload = useCallback((files: File[]) => {
    files.forEach(file => {
      const uploadId = `upload_${Date.now()}_${Math.random()}`
      const newUpload: FileUpload = {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading'
      }

      setUploads(prev => [...prev, newUpload])

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            const newProgress = Math.min(upload.progress + Math.random() * 20, 100)
            
            if (newProgress >= 100) {
              clearInterval(uploadInterval)
              
              // Simulate successful upload
              setTimeout(() => {
                const mockUrl = URL.createObjectURL(file)
                setUploads(prev => prev.map(u => 
                  u.id === uploadId 
                    ? { ...u, status: 'completed', progress: 100, url: mockUrl }
                    : u
                ))
                
                // Call the upload callback
                onFileUpload(file)
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                  setUploads(prev => prev.filter(u => u.id !== uploadId))
                }, 5000)
              }, 500)
              
              return { ...upload, progress: 100 }
            }
            
            return { ...upload, progress: newProgress }
          }
          return upload
        }))
      }, 100)
    })
  }, [onFileUpload])

  // Cancel upload
  const cancelUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, status: 'cancelled', progress: 0 }
        : upload
    ))
    
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.id !== uploadId))
    }, 1000)
  }, [])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  // Get file type icon
  const getFileIcon = (file: File | string) => {
    const fileName = typeof file === 'string' ? file : file.name
    const fileType = typeof file === 'string' ? '' : file.type

    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝'
    if (fileType.includes('spreadsheet') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊'
    if (fileType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return '📈'
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) return '🗜️'
    
    return '📎'
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Create media preview
  const createMediaPreview = useCallback((file: File): Promise<MediaPreview> => {
    return new Promise((resolve) => {
      const mediaPreview: MediaPreview = {
        id: `media_${Date.now()}`,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      }

      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          resolve({
            ...mediaPreview,
            dimensions: { width: img.width, height: img.height }
          })
        }
        img.src = mediaPreview.url
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
          resolve({
            ...mediaPreview,
            duration: video.duration,
            dimensions: { width: video.videoWidth, height: video.videoHeight }
          })
        }
        video.src = mediaPreview.url
      } else if (file.type.startsWith('audio/')) {
        const audio = new Audio()
        audio.onloadedmetadata = () => {
          resolve({
            ...mediaPreview,
            duration: audio.duration
          })
        }
        audio.src = mediaPreview.url
      } else {
        resolve(mediaPreview)
      }
    })
  }, [])

  // Media preview modal
  const MediaPreviewModal: React.FC<{ media: MediaPreview; onClose: () => void }> = ({ media, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="max-w-4xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-white">{media.name}</h3>
              <p className="text-sm text-gray-400">
                {formatFileSize(media.size)}
                {media.dimensions && ` • ${media.dimensions.width}x${media.dimensions.height}`}
                {media.duration && ` • ${Math.floor(media.duration / 60)}:${(media.duration % 60).toFixed(0).padStart(2, '0')}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {media.type === 'image' && (
              <img 
                src={media.url} 
                alt={media.name}
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            )}
            
            {media.type === 'video' && (
              <video 
                src={media.url} 
                controls
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            )}
            
            {media.type === 'audio' && (
              <div className="flex items-center justify-center py-8">
                <audio src={media.url} controls className="w-full max-w-md" />
              </div>
            )}
            
            {media.type === 'document' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{getFileIcon(media.name)}</div>
                <p className="text-lg font-semibold text-white">{media.name}</p>
                <p className="text-gray-400">{formatFileSize(media.size)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-700 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onMediaShare(media)
                onClose()
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              채팅에 공유하기
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const link = document.createElement('a')
                link.href = media.url
                link.download = media.name
                link.click()
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              다운로드
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 transition-all ${
          dragOver 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">📎</div>
          <div className="text-lg font-semibold mb-2">
            파일을 드래그하여 업로드하거나 버튼을 클릭하세요
          </div>
          <div className="text-sm text-gray-400 mb-4">
            최대 {formatFileSize(maxFileSize)}, {maxFiles}개 파일까지
          </div>
          
          {/* Upload buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => imageInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🖼️ 이미지
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => videoInputRef.current?.click()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🎥 비디오
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => audioInputRef.current?.click()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🎵 오디오
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => documentInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              📄 문서
            </motion.button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 space-y-2"
          >
            <div className="text-sm font-semibold text-white mb-2">
              업로드 진행 중 ({uploads.filter(u => u.status === 'completed').length}/{uploads.length})
            </div>
            
            {uploads.map(upload => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(upload.file)}</span>
                    <div>
                      <div className="font-medium text-white">{upload.file.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatFileSize(upload.file.size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {upload.status === 'uploading' && (
                      <button
                        onClick={() => cancelUpload(upload.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    )}
                    
                    {upload.status === 'completed' && (
                      <div className="text-green-400">✓</div>
                    )}
                    
                    {upload.status === 'error' && (
                      <div className="text-red-400">⚠️</div>
                    )}
                    
                    {upload.status === 'cancelled' && (
                      <div className="text-gray-400">✕</div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${upload.progress}%` }}
                    className={`h-2 rounded-full transition-colors ${
                      upload.status === 'completed' ? 'bg-green-500' :
                      upload.status === 'error' ? 'bg-red-500' :
                      upload.status === 'cancelled' ? 'bg-gray-500' :
                      'bg-blue-500'
                    }`}
                  />
                </div>
                
                {/* Status text */}
                <div className="text-xs text-gray-400">
                  {upload.status === 'uploading' && `업로드 중... ${Math.round(upload.progress)}%`}
                  {upload.status === 'completed' && '업로드 완료'}
                  {upload.status === 'error' && (upload.error || '업로드 실패')}
                  {upload.status === 'cancelled' && '업로드 취소됨'}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Media preview modal */}
      <AnimatePresence>
        {showPreview && (
          <MediaPreviewModal
            media={showPreview}
            onClose={() => setShowPreview(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default FileMediaSystem
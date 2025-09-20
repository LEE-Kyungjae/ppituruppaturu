import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Users, Smartphone, Monitor, Globe } from 'lucide-react'

export function CrossPlatformGameMenu() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🎮 Cross-Platform Gaming
        </h1>
        <p className="text-lg text-gray-600">
          Play together across all devices - Mobile, Web, and Desktop!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Cross-Platform Physics Jump */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl">🚀</div>
              <div>
                <CardTitle className="text-xl">Physics Jump Arena</CardTitle>
                <div className="flex items-center gap-1 text-sm">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    ✨ CROSS-PLATFORM
                  </span>
                </div>
              </div>
            </div>
            <CardDescription>
              Real-time multiplayer physics game. Jump, compete, and play with users on mobile and web simultaneously!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>1-20 players</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Real-time sync</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                <Monitor className="w-3 h-3" />
                <span>Web</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/games/cross-platform-physics-jump">
                <Button className="w-full group-hover:shadow-lg transition-all duration-300" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Play Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Traditional Single Platform Games */}
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl">🎯</div>
              <div>
                <CardTitle className="text-xl">Traditional Games</CardTitle>
                <div className="text-sm text-gray-500">Web Only</div>
              </div>
            </div>
            <CardDescription>
              Classic physics games optimized for web browsers with advanced graphics and effects.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Link href="/games/physics-jump">
                <Button variant="outline" className="w-full justify-start">
                  🏃 Physics Jump
                </Button>
              </Link>
              <Link href="/games/physics-catch">
                <Button variant="outline" className="w-full justify-start">
                  🎾 Physics Catch
                </Button>
              </Link>
              <Link href="/games/physics-balance">
                <Button variant="outline" className="w-full justify-start">
                  ⚖️ Physics Balance
                </Button>
              </Link>
              <Link href="/games/advanced-physics-jump">
                <Button variant="outline" className="w-full justify-start">
                  🚀 Advanced Physics Jump
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mobile App Info */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl">📱</div>
              <div>
                <CardTitle className="text-xl">Mobile App</CardTitle>
                <div className="text-sm text-purple-600 font-semibold">Flutter App</div>
              </div>
            </div>
            <CardDescription>
              Download our mobile app to join cross-platform games and enjoy native mobile gaming experience.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-purple-800 mb-1">✨ Features:</p>
              <ul className="text-purple-700 space-y-1">
                <li>• Native performance</li>
                <li>• Real-time multiplayer</li>
                <li>• Cross-platform compatibility</li>
                <li>• Offline games available</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                🤖 Android (Coming Soon)
              </Button>
              <Button variant="outline" className="w-full" disabled>
                🍎 iOS (Coming Soon)
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Development builds available for testing
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Stack Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-center">🛠️ Cross-Platform Technology</CardTitle>
          <CardDescription className="text-center">
            Built with modern technologies for seamless cross-platform gaming
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl">⚡</div>
              <h3 className="font-semibold">Real-time WebSockets</h3>
              <p className="text-sm text-gray-600">
                Low-latency communication for instant synchronization between all players
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🎮</div>
              <h3 className="font-semibold">Optimized Game Engines</h3>
              <p className="text-sm text-gray-600">
                Canvas API for web, Flame engine for Flutter, with shared physics logic
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🔄</div>
              <h3 className="font-semibold">State Synchronization</h3>
              <p className="text-sm text-gray-600">
                Advanced algorithms ensure all players see the same game state
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import type { NextApiRequest, NextApiResponse } from 'next'

interface KakaoTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
  refresh_token_expires_in: number
}

interface KakaoUserResponse {
  id: number
  connected_at: string
  properties: {
    nickname: string
    profile_image?: string
    thumbnail_image?: string
  }
  kakao_account: {
    profile_nickname_needs_agreement?: boolean
    profile_image_needs_agreement?: boolean
    profile: {
      nickname: string
      thumbnail_image_url?: string
      profile_image_url?: string
      is_default_image?: boolean
    }
    has_email?: boolean
    email_needs_agreement?: boolean
    is_email_valid?: boolean
    is_email_verified?: boolean
    email?: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ message: '인증 코드가 필요합니다.' })
    }

    // 1. 카카오에서 액세스 토큰 받기
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/kakao/callback`,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Kakao token error:', error)
      return res.status(400).json({ message: '카카오 토큰 요청 실패' })
    }

    const tokenData: KakaoTokenResponse = await tokenResponse.json()

    // 2. 카카오에서 사용자 정보 받기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      return res.status(400).json({ message: '카카오 사용자 정보 요청 실패' })
    }

    const userData: KakaoUserResponse = await userResponse.json()

    // 3. 우리 백엔드 서버로 사용자 정보 전송하여 JWT 토큰 받기
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social/kakao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kakaoId: userData.id.toString(),
        nickname: userData.properties.nickname,
        email: userData.kakao_account.email,
        profileImage: userData.properties.profile_image,
        accessToken: tokenData.access_token,
      }),
    })

    if (!backendResponse.ok) {
      const backendError = await backendResponse.text()
      console.error('Backend auth error:', backendError)
      return res.status(400).json({ message: '인증 처리 실패' })
    }

    const authData = await backendResponse.json()

    // 4. JWT 토큰과 사용자 정보 반환
    res.status(200).json({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      user: authData.user,
    })

  } catch (error) {
    console.error('Kakao callback error:', error)
    res.status(500).json({ message: '서버 오류가 발생했습니다.' })
  }
}
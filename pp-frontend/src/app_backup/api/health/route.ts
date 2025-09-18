import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if the application is healthy
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        frontend: 'healthy',
        // You can add more service checks here
      }
    }

    return NextResponse.json(healthCheck, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  // Support HEAD requests for health checks
  return new NextResponse(null, { status: 200 })
}
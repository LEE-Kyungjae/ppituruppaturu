import { NextResponse } from 'next/server'

// Simple metrics collection for Prometheus
let requestCount = 0
let requestDuration: number[] = []
const startTime = Date.now()

export async function GET() {
  const requestStart = Date.now()
  requestCount++

  try {
    // Calculate metrics
    const uptime = (Date.now() - startTime) / 1000
    const avgResponseTime = requestDuration.length > 0 
      ? requestDuration.reduce((a, b) => a + b, 0) / requestDuration.length 
      : 0

    // Prometheus format metrics
    const metrics = `# HELP frontend_requests_total Total number of HTTP requests
# TYPE frontend_requests_total counter
frontend_requests_total ${requestCount}

# HELP frontend_request_duration_seconds Average request duration
# TYPE frontend_request_duration_seconds gauge
frontend_request_duration_seconds ${avgResponseTime / 1000}

# HELP frontend_uptime_seconds Uptime in seconds
# TYPE frontend_uptime_seconds gauge
frontend_uptime_seconds ${uptime}

# HELP frontend_memory_usage_bytes Memory usage in bytes
# TYPE frontend_memory_usage_bytes gauge
frontend_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_version_info Node.js version
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1
`

    // Record request duration
    const duration = Date.now() - requestStart
    requestDuration.push(duration)
    
    // Keep only last 100 measurements
    if (requestDuration.length > 100) {
      requestDuration = requestDuration.slice(-100)
    }

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    )
  }
}
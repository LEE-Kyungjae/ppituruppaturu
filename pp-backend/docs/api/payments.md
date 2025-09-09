# Payment API Documentation

## TossPayments Integration

### API Endpoints

#### Create Payment
```http
POST /api/v1/payments/toss/create
Content-Type: application/json

{
  "amount": 10000,
  "orderId": "order_20240101_001",
  "orderName": "포인트 충전",
  "successUrl": "https://ppituruppaturu.com/payment/success",
  "failUrl": "https://ppituruppaturu.com/payment/fail"
}
```

#### Confirm Payment
```http
POST /api/v1/payments/toss/confirm
Content-Type: application/json

{
  "paymentKey": "payment_key_from_toss",
  "orderId": "order_20240101_001",
  "amount": 10000
}
```

#### Webhook Handler
```http
POST /api/v1/payments/webhook
Content-Type: application/json

{
  "eventType": "PAYMENT_CONFIRMED",
  "orderId": "order_20240101_001",
  "paymentKey": "payment_key_from_toss",
  "status": "DONE"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "paymentKey": "payment_key_from_toss",
    "orderId": "order_20240101_001",
    "amount": 10000,
    "status": "DONE",
    "approvedAt": "2024-01-01T12:00:00+09:00"
  }
}
```
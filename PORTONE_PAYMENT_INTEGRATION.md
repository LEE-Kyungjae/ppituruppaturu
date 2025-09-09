# PortOne PG Payment Integration

This document describes the complete PortOne PG payment integration implemented for the PITTURU application.

## Overview

The payment system provides:
- Complete payment flow from frontend to backend
- Multiple payment methods (credit card, KakaoPay, bank transfer, virtual account, mobile payment)
- Payment session management and verification
- Payment history tracking
- Webhook handling for payment notifications
- Flutter-inspired UI design

## Architecture

### Backend Components

1. **PortOne Client** (`/internal/portone/client.go`)
   - Direct integration with PortOne API
   - Payment preparation, verification, cancellation
   - Webhook processing

2. **Payment Service** (`/internal/service/portone_payment_service.go`)
   - Business logic for payment operations
   - Session management
   - Database operations

3. **API Handlers** (`/internal/handler/portone_handler.go`)
   - RESTful API endpoints
   - Authentication and validation
   - Request/response handling

4. **Database Models** (`/internal/repository/payment_session.go`)
   - Payment session persistence
   - Transaction history

### Frontend Components

1. **Payment Types** (`/src/types/payment.ts`)
   - TypeScript interfaces for payment data
   - PortOne integration types

2. **Payment Service** (`/src/services/paymentService.ts`)
   - API communication layer
   - Authentication handling
   - Error management

3. **Payment Hook** (`/src/hooks/usePortOnePayment.ts`)
   - React hook for payment state management
   - PortOne script loading
   - Payment execution logic

4. **UI Components**
   - PaymentModal: Complete payment interface
   - Success/Failure pages: Result handling
   - Payment history: Transaction listing

## API Endpoints

### Payment Session Management
- `POST /api/v1/payments/sessions` - Create payment session
- `GET /api/v1/payments/sessions/{session_id}` - Get payment session
- `POST /api/v1/payments/sessions/{session_id}/prepare` - Prepare payment

### Payment Processing
- `POST /api/v1/payments/verify` - Verify payment completion
- `POST /api/v1/payments/webhook` - Handle PortOne webhooks
- `POST /api/v1/payments/{payment_id}/cancel` - Cancel payment

### Payment History
- `GET /api/v1/me/payments` - Get user payment history

## Database Schema

### payment_sessions Table
```sql
CREATE TABLE payment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    merchant_uid VARCHAR(255) NOT NULL UNIQUE,
    user_username VARCHAR(255) NOT NULL REFERENCES users(username),
    item_id UUID NOT NULL REFERENCES items(id),
    amount INT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KRW',
    quantity INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_tel VARCHAR(255) NOT NULL,
    buyer_addr VARCHAR(500),
    buyer_postcode VARCHAR(20),
    redirect_url VARCHAR(500),
    imp_uid VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### payment_history Table
```sql
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(255) NOT NULL UNIQUE,
    imp_uid VARCHAR(255) NOT NULL,
    merchant_uid VARCHAR(255) NOT NULL,
    user_username VARCHAR(255) NOT NULL REFERENCES users(username),
    item_name VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);
```

## Environment Configuration

### Backend (.env)
```bash
PORTONE_API_KEY=your_portone_api_key_here
PORTONE_API_SECRET=your_portone_api_secret_here  
PORTONE_USER_CODE=your_portone_user_code_here
PORTONE_BASE_URL=https://api.iamport.kr
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_PORTONE_USER_CODE=your_portone_user_code_here
NEXT_PUBLIC_PORTONE_PG=html5_inicis
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
NEXT_PUBLIC_PAYMENT_FAIL_URL=http://localhost:3000/payment/fail
```

## Payment Flow

1. **Initiate Payment**
   - User selects item and quantity
   - Opens PaymentModal component
   - Enters buyer information

2. **Create Session**
   - Frontend calls `/payments/sessions` API
   - Backend creates payment session in database
   - Returns session with merchant_uid

3. **Prepare Payment**
   - Frontend calls `/payments/sessions/{id}/prepare`
   - Backend prepares payment with PortOne
   - Returns preparation result

4. **Execute Payment**
   - Frontend loads PortOne script
   - Calls PortOne IMP.request_pay()
   - User completes payment on PortOne interface

5. **Verify Payment**
   - Frontend receives imp_uid from PortOne
   - Calls `/payments/verify` with imp_uid
   - Backend verifies with PortOne and updates database

6. **Complete Flow**
   - Redirect to success/failure page
   - Display payment result
   - Update user inventory if successful

## Payment Methods Supported

- `card`: Credit/Debit Cards
- `kakaopay`: KakaoPay
- `trans`: Real-time Bank Transfer
- `vbank`: Virtual Account
- `phone`: Mobile Payment

## Security Features

- JWT authentication for all API calls
- Payment session validation
- PortOne webhook signature verification
- Buyer information validation
- Amount verification against session

## Error Handling

### Frontend Errors
- Network failures
- PortOne script loading errors
- Payment cancellation by user
- Invalid payment data

### Backend Errors
- Authentication failures
- Invalid payment sessions
- PortOne API errors
- Database constraints

## Testing

### Manual Testing Checklist
1. Create payment session
2. Test each payment method
3. Verify payment completion
4. Test payment cancellation
5. Check payment history
6. Test webhook handling

### Test Environment Setup
1. Set up PortOne test account
2. Configure test PG settings
3. Use test card numbers
4. Verify sandbox mode

## Production Deployment

### Prerequisites
1. PortOne production account
2. PG contract with payment provider
3. SSL certificate for webhook URLs
4. Production database setup

### Configuration
1. Update PortOne credentials
2. Set production PG settings
3. Configure webhook URLs
4. Enable production mode

### Monitoring
1. Payment success/failure rates
2. API response times
3. Error logs
4. Webhook delivery status

## Troubleshooting

### Common Issues
1. **PortOne script not loading**: Check CORS settings
2. **Payment verification fails**: Verify API credentials
3. **Webhook not received**: Check URL accessibility
4. **Database errors**: Check migration status

### Debug Steps
1. Check browser console for errors
2. Verify API responses
3. Check server logs
4. Validate PortOne dashboard

## Support

For issues related to:
- PortOne integration: Contact PortOne support
- Payment flow: Check this documentation
- Database issues: Review migration files
- UI components: Check component documentation
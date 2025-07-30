# Environment Setup Guide

This guide explains how to configure environment variables for the Healthcare Food Application, with special focus on Rakuten API integration.

## Quick Start

1. **Choose your environment template:**
   - Development: Copy `.env.development.example` to `.env.local`
   - Staging: Use `.env.staging.example` as reference
   - Production: Use `.env.production.example` as reference

2. **Get your Rakuten API key:**
   - Visit [Rakuten Web Service](https://webservice.rakuten.co.jp/)
   - Create a developer account
   - Register your application
   - Copy the Application ID

3. **Configure your environment:**
   ```bash
   # For development
   cp .env.development.example .env.local
   # Edit .env.local and add your RAKUTEN_APPLICATION_ID
   ```

## Environment Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `.env.example` | General template with all options | Reference for all environments |
| `.env.development.example` | Development-optimized settings | Local development setup |
| `.env.staging.example` | Staging environment template | Pre-production testing |
| `.env.production.example` | Production environment template | Live deployment |
| `.env.local` | Your local development config | Created by you, never committed |

## Rakuten API Configuration

### Getting Your API Key

1. **Create Account:**
   - Go to https://webservice.rakuten.co.jp/
   - Click "新規登録" (New Registration) or "ログイン" (Login)
   - Complete the registration process

2. **Register Application:**
   - Navigate to "アプリ管理" (App Management)
   - Click "新規アプリ登録" (Register New App)
   - Fill in your application details:
     - アプリ名 (App Name): Your application name
     - アプリURL (App URL): Your application URL
     - アプリ説明 (App Description): Brief description

3. **Get Application ID:**
   - After registration, you'll receive a 20-digit Application ID
   - This is your `RAKUTEN_APPLICATION_ID`

### API Configuration Options

```bash
# Required: Your Rakuten Application ID
RAKUTEN_APPLICATION_ID=12345678901234567890

# Optional: Advanced configuration
RAKUTEN_API_BASE_URL=https://app.rakuten.co.jp/services/api
RAKUTEN_API_TIMEOUT=10000
RAKUTEN_RATE_LIMIT_RPS=1
RAKUTEN_RATE_LIMIT_RPD=1000
RAKUTEN_API_RETRY_ATTEMPTS=3
RAKUTEN_API_RETRY_DELAY=1000
RAKUTEN_ENABLE_HEALTH_CHECKS=true
RAKUTEN_HEALTH_CHECK_INTERVAL=15
```

### Mock Data Configuration

The application automatically falls back to mock data when:
- No API key is configured
- API key is invalid
- Rakuten API is unavailable
- Rate limits are exceeded

```bash
# Mock data settings
USE_MOCK_RECIPES=true          # Enable mock data fallback
MOCK_DATA_MODE=auto            # auto | force | disabled
```

## Environment-Specific Setup

### Development Environment

**File:** `.env.local` (copy from `.env.development.example`)

```bash
# Development-friendly settings
RAKUTEN_APPLICATION_ID=your_dev_key_here
NODE_ENV=development
USE_MOCK_RECIPES=true
MOCK_DATA_MODE=auto
ENABLE_ANALYTICS=false
ENABLE_ERROR_REPORTING=false
```

**Features:**
- Mock data enabled by default
- Lower rate limits for testing
- Detailed logging
- Test Stripe keys

### Staging Environment

**Reference:** `.env.staging.example`

```bash
# Staging settings
RAKUTEN_APPLICATION_ID=your_staging_key_here
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-staging-domain.vercel.app
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=false
```

**Features:**
- Production-like settings
- Real API keys with test accounts
- Enhanced logging
- Stripe test mode

### Production Environment

**Reference:** `.env.production.example`

```bash
# Production settings
RAKUTEN_APPLICATION_ID=your_production_key_here
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
```

**Features:**
- Optimized performance settings
- Full monitoring
- Live Stripe keys
- Enhanced security

## Troubleshooting

### Common Issues

1. **"Mock data is being used" message:**
   - Check if `RAKUTEN_APPLICATION_ID` is set
   - Verify API key format (20 digits)
   - Check API key validity

2. **API authentication errors:**
   - Verify API key is correct
   - Check if domain is registered with Rakuten
   - Ensure API key hasn't expired

3. **Rate limit errors:**
   - Adjust `RAKUTEN_RATE_LIMIT_RPS` and `RAKUTEN_RATE_LIMIT_RPD`
   - Check your Rakuten API plan limits
   - Monitor API usage

### Debug Endpoints

The application provides debug endpoints to check configuration:

- `/api/debug/rakuten-config` - Check API configuration status
- `/api/debug/rakuten-health` - Check API health and connectivity

### Environment Validation

The application validates environment configuration on startup:

- ✅ Valid API key format
- ✅ API connectivity test
- ✅ Rate limit configuration
- ⚠️ Warnings for missing optional settings
- ❌ Errors for critical misconfigurations

## Security Best Practices

1. **Never commit secrets:**
   - Add `.env.local` to `.gitignore`
   - Use environment variables in deployment platforms
   - Rotate API keys regularly

2. **Use different keys per environment:**
   - Development: Personal/test keys
   - Staging: Dedicated staging keys
   - Production: Production keys only

3. **Monitor API usage:**
   - Set up alerts for unusual activity
   - Monitor rate limit usage
   - Track API errors and failures

4. **Secure deployment:**
   - Use HTTPS in production
   - Enable security headers
   - Regular security audits

## Deployment Platform Setup

### Vercel

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable from your environment template
4. Set appropriate environment scopes (Development/Preview/Production)

### Other Platforms

- **Netlify:** Use site settings > Environment variables
- **Railway:** Use project settings > Variables
- **Heroku:** Use `heroku config:set` or dashboard
- **AWS/GCP/Azure:** Use platform-specific secret management

## Support

If you encounter issues:

1. Check the debug endpoints for configuration status
2. Review application logs for detailed error messages
3. Verify your Rakuten API key and account status
4. Consult the Rakuten API documentation
5. Check the application's error monitoring dashboard (if enabled)
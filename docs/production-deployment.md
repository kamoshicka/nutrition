# Production Deployment Guide

This guide covers the complete setup and deployment process for the healthcare food app in a production environment.

## Prerequisites

- Node.js 18+ installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- Stripe account with production keys
- Email service (optional, for notifications)

## Environment Setup

### 1. Environment Variables

Copy the production environment template:
```bash
cp .env.production.example .env.production
```

Fill in all required values in `.env.production`:

#### Required Variables
- `NEXTAUTH_SECRET`: 32+ character random string
- `NEXTAUTH_URL`: Your production domain (https://yourdomain.com)
- `DATABASE_URL`: Database file path or connection string
- `STRIPE_SECRET_KEY`: Production Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Production Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook endpoint secret
- `STRIPE_PRICE_ID`: Production price ID for premium plan

#### Recommended Variables
- `SENTRY_DSN`: Error monitoring
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics
- `RAKUTEN_APPLICATION_ID`: Recipe API access

### 2. Production Setup Script

Run the automated production setup:
```bash
npm run production:setup
```

This script will:
- Validate environment variables
- Create necessary directories
- Set up database with migrations
- Configure logging
- Create health check script
- Generate deployment checklist

## Database Management

### Initial Setup
```bash
# Check migration status
npm run migrate:status

# Apply pending migrations
npm run migrate

# Verify database setup
npm run health-check
```

### Backup Management
```bash
# Create backup
npm run backup:create

# List all backups
npm run backup:list

# Verify backup integrity
npm run backup:verify <backup-filename>

# Restore from backup
npm run backup:restore <backup-filename>

# Clean up old backups (based on retention policy)
npm run backup:cleanup
```

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Stripe webhooks configured
- [ ] Error monitoring setup
- [ ] Analytics configured

### 2. Build and Deploy

```bash
# Install dependencies
npm ci --production

# Build the application
npm run build

# Start the production server
npm start
```

### 3. Post-deployment Verification

```bash
# Check application health
./health-check.sh

# Verify all services
curl https://yourdomain.com/api/health

# Test critical user flows
npm run e2e:headless
```

## Monitoring and Maintenance

### Health Checks

The application provides a comprehensive health check endpoint at `/api/health` that monitors:

- Database connectivity
- Memory usage
- Disk space
- External service configuration

### Logging

Logs are structured and written to:
- `logs/app.log` - General application logs
- `logs/error.log` - Error logs only
- `logs/access.log` - HTTP access logs

Log levels can be controlled with the `LOG_LEVEL` environment variable.

### Performance Monitoring

Enable performance monitoring by setting:
```bash
ENABLE_PERFORMANCE_MONITORING=true
```

This tracks:
- HTTP response times
- Database query performance
- Memory usage
- User actions
- Subscription events

### Error Monitoring

Configure Sentry for error tracking:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ENABLE_ERROR_REPORTING=true
```

## Security Considerations

### HTTPS Enforcement

Set `FORCE_HTTPS=true` to enforce HTTPS redirects and enable HSTS headers.

### Content Security Policy

The application includes a comprehensive CSP that allows:
- Stripe payment processing
- Google Analytics
- Font loading from Google Fonts
- Image loading from various sources

### Rate Limiting

Configure rate limiting:
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

## Backup Strategy

### Automated Backups

Enable automated backups:
```bash
ENABLE_AUTOMATED_BACKUPS=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
```

### Manual Backup Process

1. Create backup before major changes:
   ```bash
   npm run backup:create
   ```

2. Verify backup integrity:
   ```bash
   npm run backup:verify <backup-filename>
   ```

3. Store backups off-site for disaster recovery

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Check `DATABASE_URL` configuration
- Verify database file permissions
- Run database health check

#### Stripe Webhook Failures
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint URL configuration
- Review webhook logs in Stripe dashboard

#### Memory Issues
- Monitor memory usage via health check
- Adjust Node.js memory limits if needed
- Consider implementing Redis caching

### Log Analysis

Check logs for issues:
```bash
# View recent errors
tail -f logs/error.log

# Search for specific issues
grep "stripe" logs/app.log
grep "database" logs/app.log
```

### Performance Issues

1. Check health endpoint for system metrics
2. Review database query performance
3. Analyze bundle size and loading times
4. Monitor external API response times

## Scaling Considerations

### Database Scaling

For high traffic, consider:
- Migrating from SQLite to PostgreSQL
- Implementing connection pooling
- Adding read replicas

### Application Scaling

- Use PM2 or similar process manager
- Implement horizontal scaling with load balancer
- Add Redis for session storage and caching

### CDN Integration

Configure CDN for static assets:
- Images and media files
- JavaScript and CSS bundles
- Font files

## Maintenance Schedule

### Daily
- Monitor error rates and performance metrics
- Check backup completion
- Review security alerts

### Weekly
- Update dependencies (security patches)
- Review and clean up old backups
- Analyze user metrics and conversion rates

### Monthly
- Full security audit
- Performance optimization review
- Database maintenance and optimization
- Update documentation

## Emergency Procedures

### Service Outage
1. Check health endpoint status
2. Review recent error logs
3. Verify external service status (Stripe, etc.)
4. Implement rollback if necessary

### Data Recovery
1. Stop application to prevent data corruption
2. Identify most recent valid backup
3. Verify backup integrity
4. Restore from backup
5. Test critical functionality
6. Resume service

### Security Incident
1. Immediately rotate all secrets and API keys
2. Review access logs for suspicious activity
3. Update security configurations
4. Notify users if data may be compromised
5. Document incident and response

## Support and Resources

- Health Check: `https://yourdomain.com/api/health`
- Error Monitoring: Sentry dashboard
- Payment Processing: Stripe dashboard
- Analytics: Google Analytics dashboard

For additional support, refer to the application logs and monitoring dashboards.
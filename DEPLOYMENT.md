# ForzaCheck - Deployment Guide

## Replit Deployment Considerations

### Important Differences in Production:

1. **Environment Variables:**
   - `NODE_ENV` is automatically set to `production`
   - `REPLIT_DEPLOYMENT=1` is available only in deployed environment
   - `DATABASE_URL` may need to be configured for PostgreSQL

2. **Data Persistence Issues:**
   - **CRITICAL**: MemStorage data is NOT persistent in deployments
   - All categories, tasks, and checklists will be lost on redeploy
   - Consider switching to PostgreSQL before deployment

3. **Build Process:**
   - Vite builds frontend to `dist/` folder in production
   - Static files are served differently than in development
   - Console logs and debug panels are hidden in production

## Pre-Deployment Checklist:

- [ ] Remove any debug panels/console logs from production code
- [ ] Ensure all environment variables are set
- [ ] Consider data persistence requirements
- [ ] Test with `NODE_ENV=production` locally

## Potential Deployment Issues:

### 1. Data Loss
**Problem:** All admin-created categories and tasks disappear
**Solution:** Switch to PostgreSQL or ensure default data recreation

### 2. Static File Serving
**Problem:** Frontend assets may not load correctly
**Solution:** Verify Vite build configuration and static file paths

### 3. API Endpoint Changes
**Problem:** Development vs production URL differences
**Solution:** Use relative API paths, not absolute URLs

## Recommended Production Setup:

1. **Database Migration:**
   ```bash
   # Switch from MemStorage to PostgreSQL
   # Update server/storage.ts to use database connection
   ```

2. **Environment Configuration:**
   ```bash
   NODE_ENV=production
   DATABASE_URL=your_postgres_connection_string
   ```

3. **Build Verification:**
   ```bash
   npm run build
   # Verify dist/ folder is created correctly
   ```

## Monitoring After Deployment:

- Check server logs for MemStorage warnings
- Verify all categories and tasks are available
- Test employee workflow end-to-end
- Confirm admin dashboard functionality

## Emergency Rollback:

If deployment fails, the development version will remain available in your Replit workspace. Use the rollback feature to restore previous working state.
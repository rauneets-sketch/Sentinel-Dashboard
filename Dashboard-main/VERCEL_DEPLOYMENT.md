# Vercel Deployment Guide

This guide will help you deploy the Sentinel Dashboard to Vercel.

## Prerequisites

1. A Vercel account
2. Your GitHub repository with the Sentinel Dashboard code
3. Supabase database credentials

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has the following files properly configured:

- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `package.json` - Node.js dependencies and scripts
- ✅ `vite.config.ts` - Vite configuration with environment variables
- ✅ `.env.example` - Environment variables template

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `rauneets-sketch/Sentinel-Dashboard`
4. Vercel will auto-detect the project settings
5. Configure environment variables (see step 3)
6. Click "Deploy"

#### Option B: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project directory:
   ```bash
   cd Dashboard-main
   vercel
   ```

### 3. Environment Variables

Configure the following environment variables in Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add the following variables:

```bash
NODE_ENV=production
SUPABASE_URL=https://wnymknrycmldwqzdqoct.supabase.co
SUPABASE_KEY=your_supabase_service_role_key_here
```

### 4. Verify Deployment

1. Wait for the build to complete (usually 1-3 minutes)
2. Click on the generated URL to access your dashboard
3. Verify that:
   - Dashboard loads correctly
   - Real data is fetched from Supabase
   - All tabs (Desktop Site, OMS, Partner Panel) work
   - Screenshots functionality works for failed journeys

## Configuration Files

### vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This configuration ensures that all routes are handled by the SPA (Single Page Application).

### Build Configuration

Vercel automatically detects:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Vite configuration is correct
- Test build locally: `npm run build`

### Environment Variables Not Working
- Double-check variable names (case-sensitive)
- Ensure Supabase key has proper permissions
- Redeploy after adding environment variables
- Test locally with same environment variables

### Dashboard Shows Mock Data
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set correctly in Vercel
- Check Supabase database has recent test data
- Review browser console for API errors
- Ensure environment variables are available at build time

### Routing Issues
- Verify `vercel.json` is in the root directory
- Check that rewrites configuration is correct
- Ensure SPA routing is properly configured

## Performance Optimization

### Vercel-Specific Optimizations
- Enable Edge Functions for better performance
- Use Vercel Analytics for monitoring
- Configure caching headers for static assets
- Enable compression for better load times

### Build Optimizations
```json
// In vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['highcharts']
        }
      }
    }
  }
})
```

## Custom Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `sentinel.yourcompany.com`)
3. Configure DNS records as instructed by Vercel
4. Vercel will automatically provision SSL certificates

## Monitoring and Analytics

- Use Vercel Analytics for performance monitoring
- Set up Vercel Speed Insights for Core Web Vitals
- Configure alerts for deployment failures
- Monitor function execution logs

## Security Considerations

- Environment variables are encrypted at rest
- Use Vercel's built-in security headers
- Enable HTTPS (automatic with Vercel)
- Regularly rotate Supabase service keys

## Comparison: Vercel vs Render

| Feature | Vercel | Render |
|---------|--------|--------|
| Build Speed | ⚡ Very Fast | 🔄 Moderate |
| Global CDN | ✅ Built-in | ❌ Not included |
| Edge Functions | ✅ Yes | ❌ No |
| Free Tier | ✅ Generous | ✅ Good |
| Custom Domains | ✅ Easy setup | ✅ Easy setup |
| Environment Variables | ✅ Dashboard UI | ✅ YAML + Dashboard |

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs in Vercel dashboard
3. Test locally first
4. Contact Vercel support if needed

---

**Deployment Status**: ✅ Ready for Vercel deployment
**Expected Deploy Time**: 1-3 minutes
**Last Updated**: January 13, 2025
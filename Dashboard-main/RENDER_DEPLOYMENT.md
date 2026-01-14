# Render Deployment Guide

This guide will help you deploy the Sentinel Dashboard to Render.com.

## Prerequisites

1. A Render.com account
2. Your GitHub repository with the Sentinel Dashboard code
3. Supabase database credentials

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has the following files properly configured:

- ✅ `render.yaml` - Render deployment configuration
- ✅ `package.json` - Node.js dependencies and scripts
- ✅ `server.js` - Express server for production
- ✅ `.env.example` - Environment variables template

### 2. Environment Variables

The following environment variables are required:

```bash
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://wnymknrycmldwqzdqoct.supabase.co
SUPABASE_KEY=your_supabase_service_role_key_here
```

### 3. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to deploy

#### Option B: Manual Web Service Creation

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `sentinel-dashboard`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SUPABASE_URL` = `https://wnymknrycmldwqzdqoct.supabase.co`
   - `SUPABASE_KEY` = `[your actual service role key]`

6. Click "Create Web Service"

### 4. Verify Deployment

1. Wait for the build to complete (usually 2-5 minutes)
2. Click on the generated URL to access your dashboard
3. Verify that:
   - Dashboard loads correctly
   - Real data is fetched from Supabase
   - All tabs (Desktop Site, OMS, Partner Panel) work
   - Screenshots functionality works for failed journeys

### 5. Custom Domain (Optional)

1. In your Render service settings, go to "Custom Domains"
2. Add your domain (e.g., `sentinel.yourcompany.com`)
3. Configure DNS records as instructed by Render

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Environment Variables Not Working
- Double-check variable names (case-sensitive)
- Ensure Supabase key has proper permissions
- Test locally with same environment variables

### Dashboard Shows Mock Data
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set correctly
- Check Supabase database has recent test data
- Review browser console for API errors

### Performance Issues
- Consider upgrading to a paid Render plan
- Optimize database queries
- Enable caching if needed

## Monitoring

- Use Render's built-in monitoring
- Check logs via Render dashboard
- Set up alerts for service downtime

## Security Notes

- Never commit actual credentials to Git
- Use Render's environment variables for sensitive data
- Regularly rotate Supabase service keys
- Enable HTTPS (automatic with Render)

## Support

For deployment issues:
1. Check Render documentation
2. Review build logs
3. Test locally first
4. Contact Render support if needed

---

**Deployment Status**: ✅ Ready for Render deployment
**Last Updated**: January 13, 2025
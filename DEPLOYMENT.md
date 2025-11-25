# 🚀 Deployment Guide - Chutney Smugglers

## ✅ Pre-Deployment Checklist

### 1. Build Verification
- [x] Build succeeds locally: `npm run build`
- [x] No TypeScript errors
- [x] All pages render correctly
- [x] Dynamic rendering configured for Convex pages

### 2. Environment Setup

You'll need accounts for:
- **Vercel** (deployment) - https://vercel.com
- **Convex** (backend) - https://convex.dev
- **Resend** (email) - https://resend.com

## 📋 Step-by-Step Deployment

### Step 1: Deploy Convex Backend

1. **Login to Convex**
   ```bash
   npx convex login
   ```

2. **Deploy to Production**
   ```bash
   npx convex deploy --prod
   ```

3. **Copy your production URL**
   - It will look like: `https://your-project-name.convex.cloud`
   - Save this for Step 2

### Step 2: Set Up Resend

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Save the key securely
4. (Optional) Add and verify your domain for custom email sending

### Step 3: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Import Project in Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "chutney-smugglers" project

3. **Configure Environment Variables**

   Add these in Vercel project settings → Environment Variables:

   ```
   NEXT_PUBLIC_CONVEX_URL=<your-prod-convex-url-from-step-1>
   AUTH_RESEND_KEY=<your-resend-api-key-from-step-2>
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   CONVEX_SITE_URL=https://your-app.vercel.app
   ```

   **Important**:
   - Use your actual Vercel domain for SITE_URL variables
   - Or use a custom domain if you have one

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Step 4: Update Convex Auth Settings

After your first deployment, update the site URL in Convex:

1. Go to your Convex dashboard
2. Navigate to Settings → URL Configuration
3. Add your production domain: `https://your-app.vercel.app`

### Step 5: Test Your Deployment

1. Visit your deployed URL
2. Create a test account
3. Complete onboarding
4. Add a test restaurant
5. Create a test rating
6. Check leaderboards
7. Test password reset email

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | ✅ Yes | Convex deployment URL | `https://happy-animal-123.convex.cloud` |
| `AUTH_RESEND_KEY` | ✅ Yes | Resend API key for emails | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | ✅ Yes | Sender email address | `noreply@yourdomain.com` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | Your app's public URL | `https://chutney-smugglers.vercel.app` |
| `CONVEX_SITE_URL` | ✅ Yes | Same as SITE_URL | `https://chutney-smugglers.vercel.app` |
| `CONVEX_DEPLOY_KEY` | ⚠️ Optional | For CI/CD automation | From Convex dashboard |

## 🔄 Redeployment

### When You Make Changes

1. **Backend changes** (convex files):
   ```bash
   npx convex deploy --prod
   ```

2. **Frontend changes**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
   Vercel will auto-deploy on push!

### Force Redeploy

In Vercel dashboard:
1. Go to Deployments
2. Click "..." on latest deployment
3. Select "Redeploy"

## 🐛 Troubleshooting

### Build Fails with "NEXT_PUBLIC_CONVEX_URL is not set"

**Solution**: Add the environment variable in Vercel:
- Go to Settings → Environment Variables
- Add `NEXT_PUBLIC_CONVEX_URL`
- Redeploy

### Auth Not Working

**Solutions**:
1. Check `CONVEX_SITE_URL` matches your domain
2. Verify Resend API key is correct
3. Check Convex dashboard auth settings
4. Ensure `AUTH_RESEND_KEY` is set

### Password Reset Emails Not Sending

**Solutions**:
1. Verify `RESEND_FROM_EMAIL` is correct
2. Check Resend dashboard for errors
3. Verify domain in Resend (if using custom domain)
4. Check `AUTH_RESEND_KEY` is valid

### Images Not Uploading

**Solution**: Convex file storage should work automatically. Check:
- Convex deployment is healthy
- Browser console for errors
- Network tab for failed requests

## 📱 PWA Installation

After deployment, users can install the app:

### iOS (Safari)
1. Visit the site
2. Tap Share button
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Visit the site
2. Tap menu (⋮)
3. Tap "Install app"

## 🔐 Security Checklist

- [x] All API keys in environment variables (not in code)
- [x] HTTPS enabled (automatic with Vercel)
- [x] Password hashing enabled (Convex Auth)
- [x] File upload validation in place
- [x] Rate limiting on Convex queries (built-in)

## 📊 Monitoring

### Vercel Analytics
- Go to your project → Analytics
- Monitor page views, performance, errors

### Convex Dashboard
- Monitor function calls
- Check database size
- View error logs

## 🎯 Post-Deployment Tasks

1. **Test all features**:
   - [ ] Sign up / Sign in
   - [ ] Password reset
   - [ ] Profile image upload
   - [ ] Add restaurant
   - [ ] Add rating
   - [ ] View leaderboards
   - [ ] Edit profile

2. **Share with friends**:
   - Send them the URL
   - Have them install as PWA
   - Start rating curries!

3. **Monitor usage**:
   - Check Vercel analytics
   - Monitor Convex usage
   - Watch for errors

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Convex Docs**: https://docs.convex.dev
- **Resend Docs**: https://resend.com/docs

---

**Deployment Status**: ✅ Ready to Deploy!

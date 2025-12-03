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
- **Brevo** (transactional emails) - https://brevo.com

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

### Step 2: Set Up Brevo

1. **Create Brevo Account**
   - Go to https://brevo.com and sign up
   - Free tier includes 300 emails/day

2. **Verify Your Domain**
   - Go to Settings → Senders & IP → Add a sender
   - Enter your sender email (e.g., `noreply@chutneysmugglers.app`)
   - Add the provided DNS records to your domain registrar:
     - **SPF record** (TXT): `v=spf1 include:spf.brevo.com ~all`
     - **DKIM record** (TXT): Brevo will provide a specific key
     - **DMARC record** (TXT): `v=DMARC1; p=none;`
   - Wait for DNS propagation (up to 48 hours)
   - Click "Verify" in Brevo dashboard

3. **Get API Key**
   - Go to Settings → API Keys
   - Create a new API key named "Chutney Smugglers Production"
   - Copy the key (shown only once!)
   - Save it securely for Step 3

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
   BREVO_API_KEY=<your-brevo-api-key-from-step-2>
   BREVO_FROM_EMAIL=noreply@chutneysmugglers.app
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   CONVEX_SITE_URL=https://your-app.vercel.app
   ```

   **Important**:
   - Use your actual Vercel domain for SITE_URL variables
   - Or use a custom domain if you have one
   - Ensure `BREVO_FROM_EMAIL` matches the verified sender in Brevo

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
| `BREVO_API_KEY` | ✅ Yes | Brevo API key for transactional emails | `xkeysib-xxxxxxxxxxxx` |
| `BREVO_FROM_EMAIL` | ✅ Yes | Verified sender email address | `noreply@chutneysmugglers.app` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | Your app's public URL | `https://chutney-smugglers.vercel.app` |
| `CONVEX_SITE_URL` | ✅ Yes | Same as SITE_URL | `https://chutney-smugglers.vercel.app` |
| `CONVEX_DEPLOY_KEY` | ⚠️ Optional | For CI/CD automation | From Convex dashboard |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ⚠️ Optional | Google Maps integration | From Google Cloud Console |

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
2. Verify Brevo API key is correct
3. Check Convex dashboard auth settings
4. Ensure `BREVO_API_KEY` is set

### Emails Not Sending (Password Reset / Booking Confirmations / Reminders)

**Solutions**:
1. Verify `BREVO_FROM_EMAIL` matches a verified sender in Brevo
2. Check Brevo dashboard → Transactional → Logs for errors
3. Ensure domain is verified in Brevo (check DNS records)
4. Verify `BREVO_API_KEY` is valid and active
5. Check Convex function logs for email errors
6. Confirm you haven't exceeded Brevo's daily limit (300 emails on free tier)

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

## 📧 Email Notifications

The app sends three types of emails via Brevo:

1. **Password Reset Emails**
   - Triggered when user requests password reset
   - Contains magic link valid for 24 hours
   - Sent immediately

2. **Booking Confirmation Emails**
   - Triggered when a new curry event is created
   - Sent to all group members
   - Includes event details and Google Maps link
   - Sent immediately

3. **Event Reminder Emails**
   - Triggered by cron job (runs daily at 9:00 AM UTC)
   - Sent to confirmed attendees 24-48 hours before event
   - Includes event details and attendee list
   - Automatically scheduled

**Note**: Cron jobs are automatically deployed with Convex. No additional setup needed!

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Convex Docs**: https://docs.convex.dev
- **Brevo Docs**: https://developers.brevo.com

---

**Deployment Status**: ✅ Ready to Deploy!

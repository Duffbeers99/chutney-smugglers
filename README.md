# 🍛 Chutney Smugglers

A beautiful, mobile-first PWA for tracking and rating your monthly curry adventures with friends. Built with Next.js, Convex, and shadcn/ui, featuring a vintage Indian curry menu aesthetic.

## ✨ Features

### V1 (Current)
- 🔐 **Email/Password Authentication** with password reset
- 👤 **User Profiles** with avatar upload and nickname customization
- 🍛 **Curry Rating System** - Rate curries on 4 categories (Food, Service, Extras, Atmosphere)
- 🏆 **Leaderboards** - Top rated restaurants and most active raters
- 📊 **Personal Dashboard** with statistics and recent activity
- 🏪 **Restaurant Management** - Add and search curry houses
- 📱 **PWA Support** - Install on mobile devices
- 🎨 **Indian-Themed UI** - Vintage curry menu aesthetic with warm colors

### Planned for V2
- 📸 Photo uploads for curry visits
- 🗺️ Google Maps integration showing all visited restaurants
- 💬 Comments and social features
- 🏅 Achievements and badges
- 📅 Calendar view of visits
- 📊 Advanced analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Convex account (free at [convex.dev](https://convex.dev))
- A Resend account for password reset emails (free at [resend.com](https://resend.com))

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Give you a deployment URL
   - Start the Convex dev server

3. **Configure environment variables**

   Create a `.env.local` file:
   ```bash
   # Convex
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url-from-step-2>

   # Resend (for password reset emails)
   AUTH_RESEND_KEY=<your-resend-api-key>
   RESEND_FROM_EMAIL=onboarding@yourdomain.com

   # Site URLs
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   CONVEX_SITE_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
chutney-smugglers/
├── app/                          # Next.js app router pages
│   ├── dashboard/               # Main dashboard
│   ├── leaderboards/            # Leaderboards page
│   ├── onboarding/              # User onboarding flow
│   ├── profile/                 # User profile & settings
│   ├── globals.css              # Global styles with Indian theme
│   ├── layout.tsx               # Root layout with PWA config
│   └── page.tsx                 # Login/signup page
│
├── components/                   # React components
│   ├── curry/                   # Curry rating components
│   ├── dashboard/               # Dashboard components
│   ├── navigation/              # Navigation components
│   ├── profile/                 # Profile components
│   └── ui/                      # shadcn/ui components
│
├── convex/                       # Convex backend
│   ├── auth.ts                  # Authentication config
│   ├── schema.ts                # Database schema
│   ├── users.ts                 # User queries/mutations
│   ├── restaurants.ts           # Restaurant queries/mutations
│   ├── ratings.ts               # Rating queries/mutations
│   └── storage.ts               # File storage utilities
│
└── public/                       # Static assets
    └── manifest.json            # PWA manifest
```

## 🎨 Design System

### Color Palette
- **Curry Orange** `#E8713D` - Primary CTAs
- **Saffron Gold** `#F4C430` - Accents
- **Terracotta** `#C77A4F` - Secondary actions
- **Spice Brown** `#5C4033` - Text
- **Old Paper** `#FFF8E7` - Backgrounds

### UI Features
- Card-based layout with paper texture
- Circular progress indicators
- Touch-friendly buttons (44px+ touch targets)
- Smooth animations
- Dark mode support

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Backend**: Convex (real-time database)
- **Authentication**: @convex-dev/auth
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## 📱 Installing as PWA

**iOS (Safari)**:
1. Open in Safari
2. Tap Share → "Add to Home Screen"

**Android (Chrome)**:
1. Open in Chrome
2. Tap menu → "Install app"

## 🗄️ Database Schema

### Users
- Profile (nickname, email, avatar)
- Statistics (ratings, added restaurants)
- Onboarding status

### Restaurants
- Name, address, cuisine
- Location data
- Aggregate ratings
- Rating count

### Ratings
- User and restaurant references
- Visit date
- 4 category scores (1-5)
- Optional notes

## 🚢 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect repository in Vercel
3. Add environment variables
4. Deploy!

### Deploy Convex to Production

```bash
npx convex deploy
```

Update `NEXT_PUBLIC_CONVEX_URL` with production URL

## 📝 Usage

1. **Sign Up** - Create account
2. **Onboarding** - Upload avatar, choose nickname
3. **Add Restaurants** - Use "+" button
4. **Rate Curries** - Score on 4 categories
5. **View Leaderboards** - See top restaurants
6. **Check Stats** - View your history

## 🤝 Contributing

Suggestions and feedback welcome! Open issues for:
- Bug reports
- Feature requests
- UI/UX improvements

## 📄 License

MIT License

---

**Happy curry rating! 🍛✨**

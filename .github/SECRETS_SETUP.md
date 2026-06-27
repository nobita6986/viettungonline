# GitHub Actions Secrets Required

## Vercel (Frontend Deployment)
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID_FRONTEND` - Frontend project ID on Vercel
- `VITE_API_URL` - Backend API URL (e.g., https://viettung-backend.up.railway.app/api)

## Railway (Backend Deployment)
- `RAILWAY_TOKEN` - Your Railway API token
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Optional
- `VERCEL_PROJECT_ID_BACKEND` - If you also deploy backend to Vercel

## How to get these secrets:

### Vercel
1. Go to https://vercel.com/account/tokens
2. Create a new token with full account access
3. Get Org ID and Project ID from your Vercel dashboard

### Railway
1. Go to https://railway.app/account
2. Generate a new token
3. Connect your Railway project to GitHub for automatic deployments

### Environment Variables
1. Go to your repository Settings > Secrets and variables > Actions
2. Add each secret with the corresponding value

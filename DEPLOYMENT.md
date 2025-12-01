# Deployment Guide

This guide will help you deploy the Asset Manager application to production using Vercel and GitHub.

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
3. **Supabase Project**: Set up a Supabase project with the database schema

## Step 1: Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration file `supabase/migrations/001_initial_schema.sql` in your Supabase project
3. Get your project credentials from Settings > API

## Step 2: Deploy to Vercel

### Option A: Import from GitHub (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
6. Click "Deploy"

### Option B: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel --prod
   ```

4. Set environment variables when prompted

## Step 3: Set up Automatic Deployments

### GitHub Actions Setup

1. Go to your GitHub repository settings
2. Click "Secrets and variables" > "Actions"
3. Add the following secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VERCEL_TOKEN` (Get from Vercel account settings)
   - `ORG_ID` (Get from Vercel project settings)
   - `PROJECT_ID` (Get from Vercel project settings)

The `.github/workflows/deploy.yml` file is already configured for automatic deployments.

## Step 4: Create First Admin User

After deployment:

1. Go to your deployed application
2. Sign up with any email
3. Go to your Supabase dashboard
4. Navigate to Authentication > Users
5. Find your user and update their role to 'admin' in the users table

## Environment Variables

### Required for Production

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

### Optional

- `DATABASE_URL`: Direct database connection string (for local development)

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Vercel

## Monitoring and Logs

- View deployment logs in Vercel dashboard
- Monitor application performance with Vercel Analytics
- Check Supabase logs for database issues

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Row Level Security**: All database tables have RLS enabled
3. **API Keys**: Use service role key only on server-side
4. **HTTPS**: Vercel automatically provides SSL certificates

## Troubleshooting

### Common Issues

1. **Build Failures**: Check environment variables and dependencies
2. **Database Connection**: Verify Supabase credentials and RLS policies
3. **Authentication Issues**: Check Supabase auth configuration
4. **Deployment Errors**: Review Vercel build logs

### Getting Help

- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review deployment logs for specific error messages

## Performance Optimization

1. **Database Indexes**: Already included in migration
2. **Image Optimization**: Next.js automatic optimization
3. **Code Splitting**: Automatic with Next.js
4. **CDN**: Vercel Edge Network

## Backup Strategy

1. **Database**: Supabase automatic backups
2. **Code**: Git version control
3. **Environment**: Store secrets securely

Your Asset Manager application is now ready for production use!

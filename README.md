# Asset Manager

A production-grade full-stack web application for enterprise asset management built with Next.js and Supabase.

## Features

### Authentication
- Admin and User roles
- Secure authentication with Supabase Auth
- Role-based access control

### Admin Features
- Create and manage users
- Create asset categories
- Create departments
- Delete assets
- Full admin dashboard with analytics
- View all system data

### User Features
- Create new assets
- View only their own assets
- Personal dashboard

### Asset Management
- Track asset name, category, purchase date, cost, and department
- Search and filter assets
- Real-time updates

### UI/UX
- Clean, modern enterprise design
- Fully responsive layout
- Professional navigation system
- Real-time data updates

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Version Control**: GitHub

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd asset-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up the database:
   - Run the migration file in `supabase/migrations/001_initial_schema.sql`
   - Or apply it via the Supabase Dashboard

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Schema

### Tables

- **users**: Extended user profiles with roles
- **assets**: Asset records with all required fields
- **categories**: Asset categories
- **departments**: Company departments

### Row Level Security

All tables have RLS policies implemented:
- Users can only see their own assets
- Admins can see all data
- Authenticated users can view categories and departments

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Default Data

The application includes default categories and departments:
- Categories: Laptop, Desktop, Monitor, Phone, Tablet, Printer, Server, Network Equipment, Software, Other
- Departments: IT, HR, Finance, Marketing, Sales, Operations, Customer Service, Executive, R&D, Other

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control
- Secure authentication flows
- Input validation and sanitization
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

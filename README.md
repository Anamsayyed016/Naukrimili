# Job Portal - Next.js Application

A modern job portal built with Next.js, featuring job listings, company profiles, resume uploads, and AI-powered resume analysis.

## Features

- **Job Search & Filtering**: Dynamic job search with trending categories
- **Company Listings**: Browse and explore companies
- **Resume Upload**: AI-powered resume parsing and form auto-fill
- **User Authentication**: Secure sign-in and registration
- **Profile Management**: Dynamic user profiles based on resume data
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **File Processing**: pdf-parse, mammoth
- **Database**: PostgreSQL
- **Deployment**: Hostinger VPS with automated CI/CD

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Hostinger server (for deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd jobportal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database and auth settings
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment

### GitHub → Hostinger Auto-Deploy

1. Create GitHub secrets (repository Settings → Secrets → Actions):
   - `HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY`, `HOSTINGER_PORT` (optional)
   - Optional: `HOSTINGER_APP_DIR`, `HOSTINGER_BRANCH`, `HOSTINGER_REPO_URL`

2. Ensure server has Node 18+ and PM2:
   ```bash
   ssh user@host 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs && sudo npm i -g pm2'
   ```

3. Push to `main`. Workflow `.github/workflows/hostinger-deploy.yml` will deploy and start the app with PM2.


This project uses automated deployment via GitHub Actions to a Hostinger VPS server.

### Deployment Features

- **Automated CI/CD**: Push to main branch triggers deployment
- **SSH-based deployment**: Secure server access
- **Zero-downtime updates**: Service restart after deployment
- **Environment management**: Server-side configuration

### Deployment Status

**Last deployment test: August 15, 2025** - Testing automated deployment from GitHub Actions to Hostinger server.

## Project Structure

```
jobportal/
├── app/                    # Next.js app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── companies/        # Companies listing
│   ├── jobs/             # Job details
│   └── resumes/          # Resume upload
├── components/            # React components
│   ├── resume/           # Resume-related components
│   └── ui/               # UI components
├── lib/                   # Utility libraries
├── types/                 # TypeScript definitions
└── .github/workflows/     # GitHub Actions
```

## API Endpoints

- `POST /api/resumes/upload` - Resume upload and AI processing
- `GET /api/companies` - Company listings
- `GET /api/jobs` - Job listings
- `GET /api/user/profile` - User profile data
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

## Resume Processing

The application features intelligent resume processing:

1. **File Upload**: Supports PDF and DOCX formats
2. **Text Extraction**: Uses pdf-parse and mammoth libraries
3. **AI Analysis**: Intelligent data extraction and form auto-fill
4. **Profile Generation**: Dynamic user profiles based on resume data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is for educational/development purposes.

## Support

For deployment issues or questions, check the GitHub Actions logs and server status.

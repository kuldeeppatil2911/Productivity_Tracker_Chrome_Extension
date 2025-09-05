# Productivity Tracker Chrome Extension

A comprehensive Chrome extension for productivity management with time tracking, site blocking, and detailed analytics powered by a MERN stack backend.

## Features

### Chrome Extension
- **Time Tracking**: Automatically tracks time spent on different websites
- **Site Blocking**: Block distracting websites during work hours
- **Focus Mode**: Timed focus sessions with automatic blocking
- **Real-time Stats**: View daily productivity metrics in popup
- **Site Categories**: Classify sites as productive, distracting, or neutral
- **Daily Reports**: Automatic generation of productivity reports

### Web Dashboard
- **Analytics Dashboard**: Comprehensive productivity insights and trends
- **Weekly/Monthly Reports**: Long-term productivity analysis
- **Site Usage Analysis**: Detailed breakdown of time spent on different sites
- **Productivity Scoring**: Intelligent scoring based on site categories
- **Data Export/Import**: Backup and restore your productivity data

### Backend API
- **Data Sync**: Sync extension data across devices
- **User Management**: Optional user accounts for multi-device sync
- **Report Generation**: Automated daily and weekly reports
- **RESTful API**: Complete API for all productivity data

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Chrome browser

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` file with your MongoDB connection string and JWT secret:
```
MONGODB_URI=mongodb://localhost:27017/productivity-tracker
JWT_SECRET=your-super-secret-jwt-key
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Dashboard Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The dashboard will run on `http://localhost:3000`

### Chrome Extension Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension should now appear in your extensions list

## Usage

### Getting Started

1. **Install the Extension**: Follow the installation steps above
2. **Start Tracking**: The extension automatically starts tracking when you visit websites
3. **Configure Categories**: Use the popup settings to categorize sites as productive or distracting
4. **View Reports**: Click the extension icon to see daily stats, or visit the web dashboard for detailed analytics

### Extension Features

#### Popup Interface
- **Dashboard Tab**: View today's time tracking stats and top sites
- **Blocking Tab**: Enable site blocking and start focus sessions
- **Settings Tab**: Configure productive/distracting sites and sync preferences

#### Site Blocking
- Add sites to the blocked list in the Blocking tab
- Enable blocking toggle to activate
- Use Focus Mode for timed productivity sessions

#### Focus Sessions
- Set duration (1-180 minutes)
- Automatically blocks distracting sites during session
- Notifications when session starts/ends

### Web Dashboard

#### Dashboard Page
- Real-time productivity metrics
- Weekly trend charts
- Top sites analysis
- Quick actions for focus sessions and data export

#### Analytics Page
- Deep productivity insights
- Weekly and monthly trends
- Productivity score analysis
- Most productive days identification

#### Settings Page
- Manage site categories
- Configure notifications
- Set daily goals
- Import/export settings

## API Endpoints

### Time Tracking
- `POST /api/time-entry` - Record time spent on a site
- `GET /api/time/entries` - Get time entries with filtering
- `GET /api/time/summary` - Get daily time summary by domain
- `GET /api/time/trends` - Get productivity trends over time

### Reports
- `POST /api/daily-report` - Save daily productivity report
- `GET /api/reports/daily` - Get daily reports
- `GET /api/reports/weekly` - Get weekly summaries
- `GET /api/reports/insights` - Get productivity insights

### Sync
- `POST /api/sync` - Sync extension data with backend
- `GET /api/sync/status` - Check sync status

### Authentication (Optional)
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/preferences` - Update user preferences

## Data Models

### TimeEntry
- Date, domain, time spent, URL, title
- User association (optional)
- Timestamp for ordering

### DailyReport
- Date, total time, productive/distracting time
- Productivity score, top sites
- User association (optional)

### User (Optional)
- Email, password, name
- Site preferences (productive/distracting/blocked)
- Sync settings

## Development

### Project Structure
```
├── chrome-extension/          # Chrome extension files
│   ├── manifest.json         # Extension manifest
│   ├── popup.html/css/js     # Extension popup
│   ├── content.js           # Content script for time tracking
│   ├── background.js        # Background script for blocking
│   └── blocked.html         # Blocked site page
├── backend/                 # Express.js API server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   └── server.js           # Main server file
└── frontend/               # React dashboard
    ├── src/components/     # React components
    └── public/            # Static files
```

### Adding New Features

1. **Extension Features**: Modify files in `chrome-extension/`
2. **API Endpoints**: Add routes in `backend/routes/`
3. **Dashboard Features**: Add components in `frontend/src/components/`

### Testing

Run backend tests:
```bash
cd backend && npm test
```

Run frontend tests:
```bash
cd frontend && npm test
```

## Deployment

### Backend Deployment
- Deploy to Heroku, AWS, or similar platform
- Set environment variables for production
- Use MongoDB Atlas for database

### Frontend Deployment
- Build production version: `npm run build`
- Deploy to Netlify, Vercel, or similar platform
- Update API endpoints for production

### Extension Distribution
- Package extension for Chrome Web Store
- Follow Chrome extension publishing guidelines

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub issues page
- Review the documentation
- Contact the development team

---

**Note**: This extension requires permissions to access browsing data for time tracking. All data is stored locally by default, with optional cloud sync through the backend API.

# Reading Assistant

A comprehensive reading tracking system for primary school students with AI-powered book recommendations. Built with React, Material-UI, Cloudflare Workers, and KV storage.

## Features

### Core Reading Management
- **Student Management**: Track student profiles, reading levels, and preferences
- **Reading Session Tracking**: Log reading sessions with assessments and notes
- **Environment Tracking**: Distinguish between school and home reading
- **Progress Analytics**: Monitor reading frequency and identify areas for attention

### Enhanced Student Profiles
- **Reading Preferences**: Capture favorite genres, likes/dislikes, and reading formats
- **Reading Level Tracking**: Monitor and update student reading levels over time
- **Progress Analytics**: Track reading frequency and identify improvement areas

### AI-Powered Recommendations
- **Personalized Suggestions**: AI-generated book recommendations based on reading history
- **Smart Filtering**: Excludes previously read books and considers dislikes
- **Age-Appropriate Content**: Considers developmental stage and reading level

### Book and Genre Management
- **Book Database**: Comprehensive library with metadata and categorization
- **Genre System**: Flexible categorization for better recommendations
- **Bulk Operations**: Import/export functionality for efficient data management

## Technology Stack

### Frontend
- **React 19.1.0** with hooks and functional components
- **Material-UI (MUI) 7.0.2** for beautiful, responsive design
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Cloudflare Workers** for serverless API
- **Hono 4.7.7** lightweight web framework
- **Cloudflare KV** for data storage
- **RSBuild 1.3.9** for fast builds

### Development Tools
- **Wrangler 4.36.0** for Cloudflare development and deployment
- **ESLint** and **Prettier** for code quality
- **TypeScript** support (configured for future migration)

## Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **Cloudflare account** with Workers enabled
- **Wrangler CLI**: `npm install -g wrangler`

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd reading-assistant
   npm install
   ```

2. **Login to Cloudflare**:
   ```bash
   npm run cf:login
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Start production server
npm run start

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# Preview deployment
npm run cf:preview

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
reading-assistant/
├── src/
│   ├── frontend/           # React application
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context providers
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main App component
│   │   └── index.js       # Entry point
│   ├── routes/            # Hono API routes
│   │   ├── students.js    # Student management
│   │   ├── sessions.js    # Reading sessions
│   │   ├── books.js       # Book management
│   │   ├── classes.js     # Class management
│   │   ├── genres.js      # Genre management
│   │   ├── recommendations.js # AI recommendations
│   │   ├── settings.js    # App settings
│   │   └── data.js        # Import/export
│   ├── data/
│   │   └── kvProvider.js  # KV storage operations
│   └── worker.js          # Main Worker entry point
├── public/                # Static assets
├── build/                 # Build output
├── package.json
├── wrangler.toml         # Cloudflare configuration
├── rsbuild.config.js     # Build configuration
└── README.md
```

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```bash
# API Configuration
ANTHROPIC_API_KEY=your_api_key_here
ENVIRONMENT=development
STORAGE_TYPE=kv
```

### Wrangler Configuration

The `wrangler.toml` file contains:

- **KV namespace** configuration for data storage
- **Environment** settings for development/production
- **Build** and deployment settings

## API Documentation

### REST API Endpoints

#### Students (`/api/students`)
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk` - Bulk import students

#### Reading Sessions (`/api/sessions`)
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session by ID
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/student/:id` - Get sessions by student

#### Books (`/api/books`)
- `GET /api/books` - List all books
- `POST /api/books` - Create new book
- `GET /api/books/:id` - Get book by ID
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `POST /api/books/bulk` - Bulk import books

#### Recommendations (`/api/recommendations`)
- `POST /api/recommendations` - Get AI book recommendations

#### Settings (`/api/settings`)
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update settings

#### Data Management (`/api/data`)
- `POST /api/data/import` - Import data from JSON
- `GET /api/data/export` - Export all data as JSON

### Response Format

**Success Response:**
```json
{
  "data": "Response data",
  "message": "Success message (optional)"
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Data Models

### Student
```json
{
  "id": "string (UUID)",
  "name": "string",
  "classId": "string | null",
  "readingLevel": "string | null",
  "lastReadDate": "ISO8601 Date | null",
  "preferences": {
    "favoriteGenreIds": ["string"],
    "likes": ["string"],
    "dislikes": ["string"],
    "readingFormats": ["string"]
  },
  "readingSessions": ["ReadingSession"],
  "createdAt": "ISO8601 Timestamp",
  "updatedAt": "ISO8601 Timestamp"
}
```

### Reading Session
```json
{
  "id": "string (UUID)",
  "date": "ISO8601 Date",
  "bookId": "string",
  "bookTitle": "string",
  "author": "string",
  "assessment": "string",
  "notes": "string | null",
  "environment": "school | home",
  "studentId": "string"
}
```

### Book
```json
{
  "id": "string (UUID)",
  "title": "string",
  "author": "string",
  "genreIds": ["string"],
  "readingLevel": "string | null",
  "ageRange": "string | null"
}
```

## Deployment

### Development Deployment
```bash
# Deploy to Cloudflare preview environment
npm run deploy
```

### Production Deployment
1. Update `wrangler.toml` with production settings
2. Deploy:
   ```bash
   wrangler deploy --env production
   ```

### Environment Configuration

**Development** (`wrangler.toml`):
```toml
[env.preview]
name = "reading-assistant-preview"
kv_namespaces = [
  { binding = "READING_MANAGER_KV", id = "your_preview_kv_id" }
]
```

**Production** (`wrangler.toml`):
```toml
name = "reading-assistant"
kv_namespaces = [
  { binding = "READING_MANAGER_KV", id = "your_production_kv_id" }
]
```

## Default Data

The application automatically initializes with default genres on first startup:

- Adventure
- Fantasy
- Mystery
- Science Fiction
- Animal Stories
- Friendship
- Family
- School
- Sports
- Humor

## Development Guidelines

### Code Style
- **ESLint** configuration for JavaScript/React
- **Prettier** for code formatting
- **Material-UI** design system consistency

### State Management
- **React Context API** for global state
- **Optimistic updates** for better UX
- **Error boundaries** for graceful error handling

### API Design
- **RESTful** endpoints
- **Consistent** error handling
- **Input validation** on all endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

Built with ❤️ for primary school reading support
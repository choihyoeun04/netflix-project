# System Architecture

## Tech Stack

### Frontend
- **React 18** - Component-based UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS Modules/Styled Components** - Component styling
- **React Player** - Video playback component

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Multer** - File upload middleware
- **GridFS** - MongoDB file storage for large video files

### Database
- **MongoDB** - Primary database
- **GridFS** - Video file storage system
- **MongoDB Atlas/Local** - Database hosting

### Development Tools
- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Architecture Decisions

### 1. Component Architecture
```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── video/           # Video-related components
│   ├── search/          # Search functionality
│   └── admin/           # Admin-specific components
├── pages/               # Page-level components
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── utils/               # Utility functions
└── styles/              # Global styles
```

### 2. State Management
- **React Context + useReducer** for global state
- **Local component state** for UI-specific state
- **Custom hooks** for data fetching and business logic

### 3. Video Storage Strategy
- **GridFS** for storing video files in MongoDB
- **Streaming** via Express.js endpoints
- **Metadata** stored in regular MongoDB collections

### 4. API Design
- **RESTful APIs** for CRUD operations
- **Streaming endpoints** for video delivery
- **File upload endpoints** for admin functionality

### 5. Responsive Design
- **Mobile-first approach** with CSS Grid/Flexbox
- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Touch-friendly** controls for mobile devices

## System Flow

### Video Upload Flow
1. Admin uploads video via upload form
2. Multer processes file upload
3. GridFS stores video file in MongoDB
4. Metadata saved to videos collection
5. Video becomes available for streaming

### Video Streaming Flow
1. User requests video
2. Backend streams video chunks via GridFS
3. React Player handles playback
4. Progress and metadata tracked

### Search Flow
1. User enters search query
2. MongoDB text search on video metadata
3. Results returned with pagination
4. UI updates with search results

## Security Considerations
- Input validation on all endpoints
- File type validation for uploads
- Rate limiting on API endpoints
- CORS configuration for frontend-backend communication

## Performance Optimizations
- Video thumbnail generation
- Lazy loading for video carousels
- Pagination for large datasets
- Caching strategies for frequently accessed content
- Progressive video loading

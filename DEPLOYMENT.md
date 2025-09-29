# Deployment Guide

## Prerequisites

- Node.js 16+ installed
- MongoDB installed and running
- Git for version control

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd netflix-project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

**Backend (.env):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/netflix
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.development):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start Development Servers

```bash
# Terminal 1: Start MongoDB
sudo service mongod start

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm start
```

## Production Deployment

### 1. Build Applications

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### 2. Production Environment Variables

**Backend (.env.production):**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/netflix
CORS_ORIGIN=http://your-domain.com
```

**Frontend (.env.production):**
```
REACT_APP_API_URL=http://your-api-domain.com/api
GENERATE_SOURCEMAP=false
```

### 3. Start Production Servers

```bash
# Start backend
cd backend
npm start

# Serve frontend (using serve package)
cd frontend
npx serve -s build -l 3000
```

## Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

### 1. Backend Optimizations
- Enable gzip compression
- Set up MongoDB indexes
- Configure connection pooling
- Implement rate limiting

### 2. Frontend Optimizations
- Enable service worker caching
- Optimize images and assets
- Configure CDN for static files
- Enable browser caching headers

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:5000/

# Frontend health
curl http://localhost:3000/
```

### Database Maintenance
```bash
# Create database backup
mongodump --db netflix --out backup/

# Restore database
mongorestore --db netflix backup/netflix/
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN environment variable
   - Verify frontend URL matches backend CORS config

2. **MongoDB Connection Issues**
   - Ensure MongoDB service is running
   - Check MONGODB_URI format
   - Verify database permissions

3. **File Upload Issues**
   - Check disk space for video storage
   - Verify GridFS configuration
   - Monitor memory usage during uploads

4. **Performance Issues**
   - Monitor API response times
   - Check database query performance
   - Verify caching is working

### Logs
```bash
# Backend logs
cd backend && npm run dev

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# System resources
htop
df -h
```

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use secure random values for secrets
   - Rotate credentials regularly

2. **File Uploads**
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Implement rate limiting

3. **Database Security**
   - Enable MongoDB authentication
   - Use SSL/TLS connections
   - Regular security updates

## Scaling Considerations

### Horizontal Scaling
- Load balancer for multiple backend instances
- CDN for static assets
- Database replication/sharding

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Test restore procedures
   - Off-site backup storage

2. **Application Backups**
   - Version control for code
   - Configuration backups
   - Asset file backups

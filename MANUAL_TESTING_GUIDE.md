# Teaching Center Management System - Manual Testing Guide

## 🧪 Testing Checklist for All User Accounts

### Prerequisites
1. ✅ Development server running on http://localhost:3004
2. ✅ Database seeded with demo data
3. ✅ All UI components implemented

### Demo Accounts
```
Admin:   admin@teachingcenter.com   / demo123
Teacher: teacher@teachingcenter.com / demo123  
Parent:  parent@teachingcenter.com  / demo123
Student: student@teachingcenter.com / demo123
```

## 🔍 Test Scenarios

### 1. Home Page Testing
- [ ] **Navigate to http://localhost:3004**
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: "Teaching Center" branding visible
- [ ] **Verify**: Sign In link/button available
- [ ] **Verify**: Responsive design on different screen sizes

### 2. Authentication System Testing

#### 2.1 Sign In Page
- [ ] **Navigate to**: /auth/signin
- [ ] **Verify**: Sign in form loads
- [ ] **Verify**: Email and password fields present
- [ ] **Verify**: Submit button functional

#### 2.2 Invalid Login Test
- [ ] **Try**: wrong email/password combination
- [ ] **Verify**: Error message displays
- [ ] **Verify**: No redirect occurs

### 3. Admin Account Testing
- [ ] **Login with**: admin@teachingcenter.com / demo123
- [ ] **Verify**: Redirects to `/admin/dashboard`
- [ ] **Verify**: Admin dashboard loads with stats
- [ ] **Verify**: Analytics button visible and clickable
- [ ] **Verify**: Navigation to `/admin/analytics` works
- [ ] **Verify**: User info displays correctly
- [ ] **Verify**: Sign out button works

#### Admin Dashboard Features
- [ ] **Quick Stats**: Student count, payment info visible
- [ ] **Management Links**: Students, Finance, Academic, Parents, Messages
- [ ] **Navigation**: All admin links functional
- [ ] **Analytics**: Comprehensive metrics and charts
- [ ] **Responsive**: Works on mobile/tablet

### 4. Student Account Testing
- [ ] **Login with**: student@teachingcenter.com / demo123
- [ ] **Verify**: Redirects to `/student/dashboard`
- [ ] **Verify**: Student dashboard loads
- [ ] **Verify**: Welcome message with student name
- [ ] **Verify**: Quick stats cards display
- [ ] **Verify**: Upcoming tests section
- [ ] **Verify**: Recent grades section
- [ ] **Verify**: Teaching plan (if available)
- [ ] **Verify**: Breadcrumb navigation
- [ ] **Verify**: Sign out functionality

#### Student Dashboard Features
- [ ] **Personal Info**: Student ID, grade, status
- [ ] **Academic Stats**: Tests, grades, average scores
- [ ] **Payment Info**: Pending payments count
- [ ] **UI Components**: LoadingSpinner, Cards, Badges work
- [ ] **Responsive**: Mobile-friendly layout

### 5. Parent Account Testing
- [ ] **Login with**: parent@teachingcenter.com / demo123
- [ ] **Verify**: Redirects to `/parent/dashboard`
- [ ] **Verify**: Parent dashboard loads
- [ ] **Verify**: Child selector (if multiple children)
- [ ] **Verify**: Child overview information
- [ ] **Verify**: Academic monitoring features
- [ ] **Verify**: Payment tracking
- [ ] **Verify**: Sign out works

#### Parent Dashboard Features
- [ ] **Multi-Child**: Child selection interface
- [ ] **Academic Overview**: Grades and test schedules
- [ ] **Communication**: Access to messaging
- [ ] **Financial**: Payment status and history
- [ ] **Navigation**: User-friendly interface

### 6. Teacher/Staff Account Testing
- [ ] **Login with**: teacher@teachingcenter.com / demo123
- [ ] **Verify**: Redirects to `/admin/dashboard` (staff access)
- [ ] **Verify**: Staff-level permissions
- [ ] **Verify**: Can access student management
- [ ] **Verify**: Can access academic tools
- [ ] **Verify**: Cannot access all admin features
- [ ] **Verify**: Sign out works

### 7. API Endpoint Testing

#### Authentication APIs
- [ ] **GET /api/auth/session**: Returns appropriate response
- [ ] **Protected routes**: Return 401/403 when not authenticated

#### Dashboard APIs
- [ ] **GET /api/student/dashboard**: Works when authenticated as student
- [ ] **GET /api/parent/dashboard**: Works when authenticated as parent
- [ ] **GET /api/admin/stats**: Works when authenticated as admin
- [ ] **GET /api/admin/analytics**: Works when authenticated as admin

### 8. UI Component Testing

#### LoadingSpinner
- [ ] **Displays**: During dashboard loading
- [ ] **Configurable**: Different sizes work
- [ ] **Smooth**: Animation is fluid

#### Breadcrumb Navigation
- [ ] **Shows**: Current page path
- [ ] **Clickable**: Links work correctly
- [ ] **Home Icon**: Returns to home page

#### Notification System
- [ ] **Global**: Notifications display properly
- [ ] **Auto-dismiss**: Timeout functionality
- [ ] **Types**: Success, error, warning, info variants

#### Cards and Badges
- [ ] **Consistent**: Styling across dashboards
- [ ] **Responsive**: Work on all screen sizes
- [ ] **Interactive**: Hover effects function

### 9. Responsive Design Testing
- [ ] **Desktop**: Full functionality (1920x1080)
- [ ] **Laptop**: Proper scaling (1366x768)
- [ ] **Tablet**: Touch-friendly (768x1024)
- [ ] **Mobile**: Usable interface (375x667)

### 10. Performance Testing
- [ ] **Load Time**: Pages load within 3 seconds
- [ ] **Smooth Navigation**: No lag between pages
- [ ] **API Response**: Fast data retrieval
- [ ] **Memory Usage**: No obvious memory leaks

## 🚨 Common Issues to Check

### Authentication Issues
- ❌ **Infinite redirect loops**
- ❌ **Session not persisting**
- ❌ **Wrong dashboard redirect**
- ❌ **Sign out not working**

### Dashboard Issues  
- ❌ **Empty data/No data loading**
- ❌ **API errors in console**
- ❌ **Components not rendering**
- ❌ **Responsive layout broken**

### Database Issues
- ❌ **Connection failures**
- ❌ **Missing demo data**
- ❌ **Query errors**
- ❌ **Slow responses**

## ✅ Success Criteria

### All Tests Pass When:
1. **Authentication**: All 4 user types can login and access correct dashboards
2. **Navigation**: All links work and redirect properly
3. **Data Display**: Dashboards show relevant information
4. **UI Components**: All reusable components function correctly
5. **Responsive**: Works on mobile, tablet, and desktop
6. **Performance**: Fast loading and smooth interactions
7. **Security**: Proper access control and session management

## 🔧 Debugging Steps

### If Student Dashboard Won't Load:
1. Check browser console for errors
2. Verify API endpoint `/api/student/dashboard` responds
3. Check if student data exists in database
4. Verify authentication session is valid
5. Check TypeScript compilation errors

### If Authentication Fails:
1. Verify NextAuth configuration
2. Check database connection
3. Verify user records exist
4. Check session storage
5. Review middleware configuration

### If Pages Are Blank:
1. Check component imports
2. Verify all dependencies installed
3. Check for TypeScript errors
4. Review console for runtime errors
5. Verify file paths are correct

---

## 📋 Test Results Template

```
Date: ___________
Tester: ___________

□ Home Page Loads
□ Sign In Page Functional
□ Admin Login & Dashboard ✓/❌
□ Student Login & Dashboard ✓/❌  
□ Parent Login & Dashboard ✓/❌
□ Teacher Login & Dashboard ✓/❌
□ API Endpoints Responding ✓/❌
□ UI Components Working ✓/❌
□ Responsive Design ✓/❌
□ Performance Acceptable ✓/❌

Overall System Status: ✅ READY / ⚠️ NEEDS WORK / ❌ NOT READY

Notes:
_________________________________
_________________________________
```

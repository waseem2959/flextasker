# FlexTasker User Roles

This document defines the three user roles in the FlexTasker platform. These are the ONLY roles that should be used throughout the application.

## 1. USER
**Definition**: A general user who can post tasks and receive services.

**Capabilities**:
- Create and post tasks that need to be completed
- Browse and search for available taskers
- Review bids from taskers
- Accept or reject bids
- Communicate with taskers via messaging
- Make payments for completed tasks
- Leave reviews and ratings for taskers
- Manage their own profile
- View task history

**Cannot**:
- Bid on tasks
- Complete tasks for others
- Access admin functions

## 2. TASKER
**Definition**: A service provider who can complete tasks for others.

**Capabilities**:
- Browse available tasks
- Submit bids on tasks
- Complete accepted tasks
- Communicate with users via messaging
- Receive payments for completed work
- Build their service provider profile
- Showcase skills and portfolio
- Receive reviews and ratings
- View earnings and task history

**Cannot**:
- Post tasks (unless they switch to USER mode)
- Access admin functions
- Approve their own bids

## 3. ADMIN
**Definition**: Platform administrator who manages the entire system.

**Capabilities**:
- Full access to all platform features
- Manage user accounts (activate/deactivate)
- Resolve disputes between users and taskers
- Access platform analytics and reports
- Manage categories and platform settings
- Review and moderate content
- Handle payment disputes
- Access system logs and monitoring
- Configure platform policies
- Manage notification templates

**Special Access**:
- Admin dashboard
- User management interface
- Financial reports
- System configuration
- Content moderation tools

## Implementation Notes

1. **Role Assignment**: 
   - New users select their role during registration (USER or TASKER)
   - ADMIN role can only be assigned by existing admins

2. **Role Switching**:
   - Users can have both USER and TASKER capabilities
   - They can switch between modes in their profile
   - ADMIN role cannot be self-assigned

3. **Database Storage**:
   - Roles are stored as strings in the database
   - Valid values: 'USER', 'TASKER', 'ADMIN'
   - Enforced by the UserRole enum in shared/types/enums.ts

4. **Frontend Access Control**:
   - Role-based routing and component visibility
   - Protected routes based on user role
   - UI elements shown/hidden based on role

5. **Backend Authorization**:
   - API endpoints check user role before processing
   - Middleware validates role permissions
   - Role-specific business logic enforcement

## Code References

- **Enum Definition**: `shared/types/enums.ts` - UserRole enum
- **Database Schema**: `server/prisma/schema.prisma` - User model role field
- **Type Exports**: `src/types/index.ts` - UserRole re-exported for frontend use

Remember: These are the ONLY three roles in the system. Do not create or reference any other roles.

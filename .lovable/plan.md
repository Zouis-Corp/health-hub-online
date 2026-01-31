
# Tablet Kart - MrMed Style Medical E-Commerce Platform

## Overview

This plan implements a complete medical e-commerce platform with prescription-controlled ordering, role-based access control, and a comprehensive admin panel using Supabase as the backend.

## Current State

The project currently has:
- Frontend pages: Home, Conditions, Medicine Detail, Upload Prescription, Cart, Dashboard
- All data is hardcoded/mock data within components
- No Supabase integration
- No authentication system
- No admin panel

## Implementation Phases

### Phase 1: Supabase Setup & Database Schema

**Enable Lovable Cloud** to get a managed Supabase backend with automatic configuration.

**Database Tables to Create:**

```text
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  profiles                    user_roles                         │
│  ─────────                   ──────────                         │
│  id (PK, FK→auth.users)      id (PK)                           │
│  name                        user_id (FK→auth.users)           │
│  phone                       role (admin|pharmacist|user)       │
│  created_at                                                     │
│                                                                 │
│  conditions                  medicines                          │
│  ──────────                  ─────────                          │
│  id (PK)                     id (PK)                           │
│  name                        name                               │
│  slug                        slug                               │
│  description                 condition_id (FK→conditions)       │
│  is_active                   salt_name                          │
│  created_at                  brand                              │
│                              dosage                             │
│                              prescription_required              │
│                              price                              │
│                              original_price                     │
│                              stock                              │
│                              is_active                          │
│                              image_url                          │
│                              description                        │
│                                                                 │
│  orders                      order_items                        │
│  ──────                      ───────────                        │
│  id (PK)                     id (PK)                           │
│  user_id (FK→auth.users)     order_id (FK→orders)              │
│  status                      medicine_id (FK→medicines)         │
│  total_amount                quantity                           │
│  payment_status              price                              │
│  address_id (FK→addresses)                                      │
│  created_at                                                     │
│                                                                 │
│  prescriptions               addresses                          │
│  ─────────────               ─────────                          │
│  id (PK)                     id (PK)                           │
│  user_id (FK→auth.users)     user_id (FK→auth.users)           │
│  order_id (FK→orders)        name                               │
│  file_url                    phone                              │
│  status                      address_line                       │
│  approved_by (FK→auth.users) city                               │
│  notes                       state                              │
│  created_at                  pincode                            │
│                              is_default                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Order Status Flow:**
- `pending_rx` → Waiting for prescription approval
- `approved` → Prescription approved, ready for payment
- `rejected` → Prescription rejected
- `processing` → Payment received, preparing order
- `shipped` → Order dispatched
- `delivered` → Order delivered

**Security (RLS Policies):**
- Users can only see their own orders, prescriptions, and addresses
- Admins and pharmacists can view all orders and prescriptions
- Pharmacists can approve/reject prescriptions
- Admins have full access to all data
- Separate `user_roles` table to prevent privilege escalation

---

### Phase 2: Authentication System

**Create Authentication Pages:**

1. **Auth Page** (`/auth`)
   - Login form with email/password
   - Signup form with email/password
   - Phone number input for profile
   - Automatic redirect after authentication
   - Error handling for existing users

2. **Auth Context Provider**
   - Session management using `onAuthStateChange`
   - User profile fetching
   - Role-based access control
   - Protected route wrapper component

3. **Header Updates**
   - Dynamic Login/Logout button based on auth state
   - User avatar/initials display when logged in
   - Profile dropdown menu

---

### Phase 3: Storage Setup

**Create Storage Buckets:**

1. **prescriptions** (Private bucket)
   - User-uploaded prescription images/PDFs
   - RLS: Users can upload/view own files; Admins/Pharmacists can view all

2. **medicine-images** (Public bucket)
   - Medicine product images
   - RLS: Public read; Admin write

---

### Phase 4: Frontend Integration

**Update Existing Pages:**

1. **Conditions Page**
   - Fetch conditions from database
   - Fetch medicines filtered by condition
   - Real-time search and filtering

2. **Medicine Detail Page**
   - Fetch medicine details by slug/id
   - Add to cart functionality with local storage
   - Show prescription required badge

3. **Cart Page**
   - Persistent cart using local storage
   - Check for prescription-required items
   - Block checkout if prescription needed but not uploaded
   - Create order flow

4. **Upload Prescription Page**
   - Upload files to Supabase Storage
   - Create prescription record
   - Link to pending order if applicable

5. **User Dashboard**
   - Fetch real orders from database
   - Display prescription status
   - Manage addresses
   - Edit profile

**New Components:**

1. **Cart Context** - Global cart state management
2. **Auth Context** - Authentication state management
3. **Protected Route** - Route guard for authenticated pages

---

### Phase 5: Admin Panel

**Create Admin Section** (`/admin/*`)

**Layout:**
- Sidebar navigation
- Header with admin info
- Role-based menu items

**Admin Pages:**

1. **Dashboard** (`/admin`)
   - Total orders count
   - Pending prescription approvals count
   - Revenue statistics
   - Active users count
   - Recent activity feed

2. **Conditions Management** (`/admin/conditions`)
   - Table view of all conditions
   - Add/Edit condition modal
   - Enable/disable toggle
   - Slug auto-generation

3. **Medicines Management** (`/admin/medicines`)
   - Table view with pagination
   - Add/Edit medicine form
   - Condition dropdown selection
   - Price and stock management
   - Prescription required toggle
   - Image upload

4. **Prescription Approval** (`/admin/prescriptions`) - CORE FEATURE
   - Table with pending prescriptions first
   - View prescription image/PDF modal
   - User and order information
   - Medicine(s) in the order
   - Approve/Reject buttons with notes
   - Status filter tabs

5. **Orders Management** (`/admin/orders`)
   - Table with all orders
   - Filter by status
   - Order details modal
   - Update delivery status
   - View associated prescription

6. **Users Management** (`/admin/users`)
   - Table of all users
   - View user details and order history
   - Role assignment (Admin only)
   - Block/unblock user

---

### Phase 6: Business Logic Implementation

**Prescription-Order Flow:**

```text
User adds Rx-required medicine to cart
            ↓
User proceeds to checkout
            ↓
System checks for prescription
            ↓
┌──────────────────────────────────────┐
│  If no prescription uploaded:        │
│  → Block checkout                    │
│  → Show "Upload Prescription" prompt │
└──────────────────────────────────────┘
            ↓
User uploads prescription
            ↓
Order created with status = "pending_rx"
            ↓
Admin/Pharmacist reviews prescription
            ↓
┌──────────────┬───────────────────────┐
│   APPROVED   │       REJECTED        │
├──────────────┼───────────────────────┤
│ Order status │ Order status          │
│ → "approved" │ → "rejected"          │
│              │                       │
│ Enable       │ Notify user           │
│ payment      │ with reason           │
└──────────────┴───────────────────────┘
```

**Payment Flow (Future):**
- After prescription approval, payment can be enabled
- Integration with payment gateway (Stripe) can be added later

---

## File Structure

```text
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── ConditionsTable.tsx
│   │   ├── MedicinesTable.tsx
│   │   ├── PrescriptionsTable.tsx
│   │   ├── OrdersTable.tsx
│   │   └── UsersTable.tsx
│   ├── auth/
│   │   ├── AuthForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── ... (existing components)
├── contexts/
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useRole.ts
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminConditions.tsx
│   │   ├── AdminMedicines.tsx
│   │   ├── AdminPrescriptions.tsx
│   │   ├── AdminOrders.tsx
│   │   └── AdminUsers.tsx
│   ├── Auth.tsx
│   └── ... (existing pages)
└── types/
    └── database.ts
```

---

## Technical Details

### Database Migrations

Migrations will be created for:
1. Creating enum types (`app_role`, `order_status`, `prescription_status`, `payment_status`)
2. Creating all tables with proper foreign keys
3. Enabling RLS on all tables
4. Creating security definer functions for role checking
5. Creating RLS policies for each table
6. Creating storage buckets with appropriate policies
7. Seeding initial conditions data

### Security Considerations

- Roles stored in separate `user_roles` table (not in profiles)
- `has_role` function with `SECURITY DEFINER` to prevent RLS recursion
- All admin routes protected by role check
- Server-side validation for all operations
- Input validation using Zod for forms

### Data Hooks

Using TanStack Query for:
- `useConditions()` - Fetch all conditions
- `useMedicines(conditionId?)` - Fetch medicines with optional filter
- `useMedicine(id)` - Fetch single medicine
- `useOrders()` - Fetch user's orders
- `usePrescriptions()` - Fetch user's prescriptions
- `useAddresses()` - Fetch user's addresses
- Admin-specific hooks with different RLS context

---

## Implementation Order

1. Enable Lovable Cloud / Supabase
2. Create database migrations (schema + RLS)
3. Create storage buckets
4. Implement AuthContext and Auth page
5. Update Header with auth state
6. Create CartContext
7. Update Conditions page with real data
8. Update Medicine Detail page
9. Update Cart page with checkout flow
10. Update Upload Prescription with storage
11. Update User Dashboard with real data
12. Create Admin Layout and routes
13. Implement Admin Dashboard
14. Implement Conditions Management
15. Implement Medicines Management
16. Implement Prescription Approval (CORE)
17. Implement Orders Management
18. Implement Users Management
19. Add role-based navigation
20. Testing and refinement

---

## Summary

This implementation will transform the current static frontend into a fully functional medical e-commerce platform with:

- Complete database schema matching the MrMed model
- Secure authentication with role-based access
- Prescription-controlled order flow
- Comprehensive admin panel for business operations
- Real-time data synchronization
- Scalable architecture for future enhancements (payments, notifications, etc.)

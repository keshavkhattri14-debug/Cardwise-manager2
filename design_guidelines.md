# Business Card Scanner & Customer Management App - Design Guidelines

## Architecture Decisions

### Authentication
**No Authentication Required** - This is a single-user business management tool with local data storage.

**Profile/Settings Screen Required:**
- User-customizable avatar (generate 1 business-themed preset avatar - professional briefcase or handshake icon)
- Business owner display name field
- App preferences: theme toggle, notification settings, default currency
- Data backup/export options

### Navigation Architecture

**Tab Navigation (4 tabs + Floating Action Button)**

The app has 4 distinct feature areas with a core scanning action:

1. **Home Tab**: Dashboard with quick stats and recent scans
2. **Customers Tab**: Full customer list with search/filter
3. **Analytics Tab**: Charts, rankings, and insights
4. **Profile Tab**: Settings and preferences

**Floating Action Button (FAB):** Camera/Scan Card (positioned bottom-right, always accessible)

### Information Architecture

**Screen Hierarchy:**
```
Root (Tab Navigator)
├── Home Stack
│   ├── Dashboard Screen
│   └── Customer Detail Screen (modal)
├── Customers Stack
│   ├── Customer List Screen
│   ├── Customer Detail Screen
│   └── Edit Customer Screen (modal)
├── Analytics Stack
│   ├── Analytics Dashboard Screen
│   └── Detailed Report Screen
├── Profile Stack
│   ├── Profile Screen
│   └── Settings Screen
└── Scanner (Modal Stack)
    ├── Camera Scanner Screen
    ├── AI Processing Screen
    └── Confirm Details Screen
```

---

## Screen Specifications

### 1. Dashboard Screen (Home Tab)
**Purpose:** Quick overview of business metrics and recent activity

**Layout:**
- **Header:** Transparent header with greeting text ("Good Morning, [Name]") and notification bell icon (right)
- **Main Content:** Scrollable view
  - Top Stats Cards (3 cards in row): Total Customers, This Month Revenue, Pending Collections
  - Quick Actions Section: Scan Card, Add Manual Entry
  - Recent Scans List (last 5 with preview)
  - Top Customer This Month card
- **Safe Area:** Top inset = headerHeight + Spacing.xl, Bottom inset = tabBarHeight + Spacing.xl + FAB clearance

### 2. Camera Scanner Screen (Modal)
**Purpose:** Capture business card image

**Layout:**
- **Header:** Custom dark header with "Scan Card" title, close button (left)
- **Main Content:** Full-screen camera viewfinder
  - Card frame overlay with corner guides
  - Capture button (bottom center, large circular)
  - Gallery icon (bottom left) to select from photos
  - Flash toggle (top right)
- **Safe Area:** Full screen experience, controls positioned within safe insets

### 3. AI Processing Screen (Modal)
**Purpose:** Show loading state while AI extracts data

**Layout:**
- **Header:** None
- **Main Content:** 
  - Card image preview (top third)
  - Animated extraction indicator
  - Progress text: "Analyzing card...", "Extracting details..."
- **Safe Area:** Top inset = insets.top + Spacing.xl

### 4. Confirm Details Screen (Modal)
**Purpose:** Review and edit AI-extracted data before saving

**Layout:**
- **Header:** Default header, "Confirm Details" title, Cancel (left), Save (right)
- **Main Content:** Scrollable form with pre-filled fields
  - Card image thumbnail at top
  - Form fields: Name, Business Name, Mobile, Email, Address, Business Type
  - Each field editable with pencil icon
- **Safe Area:** Top = Spacing.xl, Bottom = insets.bottom + Spacing.xl
- **Submit/Cancel:** Header buttons

### 5. Customer List Screen (Customers Tab)
**Purpose:** Browse all customers with search and filters

**Layout:**
- **Header:** Transparent header with "Customers" title, search bar integrated, filter icon (right)
- **Main Content:** Scrollable list (FlatList)
  - Customer cards showing: Avatar/Initial, Name, Business, Last Purchase, Pending Amount
  - Pull-to-refresh
  - Alphabetical section headers
- **Safe Area:** Top = headerHeight + Spacing.xl, Bottom = tabBarHeight + Spacing.xl

### 6. Customer Detail Screen
**Purpose:** View complete customer information and transaction history

**Layout:**
- **Header:** Default header with customer name, edit icon (right), back button (left)
- **Main Content:** Scrollable view
  - Customer header card: Avatar, Name, Business, Contact info
  - Stats row: Total Purchased, Amount Paid, Amount Pending
  - Transaction History list with tabs: All, Products, Payments
  - Each transaction card: Date, Products, Quantity, Amount, Status
- **Floating Elements:** 
  - Quick action buttons (Call, WhatsApp, Email) sticky at bottom
  - Shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- **Safe Area:** Top = Spacing.xl, Bottom = tabBarHeight + Spacing.xl + action buttons height

### 7. Edit Customer Screen (Modal)
**Purpose:** Manually update customer information

**Layout:**
- **Header:** Default header, "Edit Customer" title, Cancel (left), Save (right)
- **Main Content:** Scrollable form
  - All customer fields editable
  - Rescan Card button at bottom
- **Safe Area:** Top = Spacing.xl, Bottom = keyboard-aware + Spacing.xl
- **Submit/Cancel:** Header buttons

### 8. Analytics Dashboard Screen (Analytics Tab)
**Purpose:** Visualize business metrics and rankings

**Layout:**
- **Header:** Transparent header, "Analytics" title, date range picker (right)
- **Main Content:** Scrollable view
  - Period selector chips: Week, Month, Quarter, Year
  - Revenue Chart (line/bar graph)
  - Top 10 Customers Ranking (leaderboard style with medals for top 3)
  - Top Products Sold (horizontal bar chart)
  - Payment Status Pie Chart (Collected vs Pending)
- **Safe Area:** Top = headerHeight + Spacing.xl, Bottom = tabBarHeight + Spacing.xl

### 9. Profile Screen (Profile Tab)
**Purpose:** User settings and app preferences

**Layout:**
- **Header:** Transparent header, "Profile" title
- **Main Content:** Scrollable view
  - Profile card: Avatar (editable), Name, Business Name
  - Settings list: Theme, Notifications, Currency, Language
  - Data Management: Export Data, Backup
  - About: App Version, Help & Support
- **Safe Area:** Top = headerHeight + Spacing.xl, Bottom = tabBarHeight + Spacing.xl

---

## Design System

### Color Palette
**Primary Gradient Theme (Inspired by premium fintech apps):**
- Primary Start: #6366F1 (Indigo)
- Primary End: #8B5CF6 (Purple)
- Secondary: #10B981 (Emerald - for success/payments)
- Warning: #F59E0B (Amber - for pending)
- Error: #EF4444 (Red)
- Background: #FFFFFF (Light mode), #111827 (Dark mode)
- Surface: #F9FAFB (Light), #1F2937 (Dark)
- Text Primary: #111827 (Light), #F9FAFB (Dark)
- Text Secondary: #6B7280

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold, 28-32pt
- **Subheaders:** 20-24pt, Semibold
- **Body:** 16pt, Regular
- **Caption:** 14pt, Regular
- **Small:** 12pt, Medium

### Spacing Scale
- xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48

### Component Specifications

**Customer Cards:**
- Background: Surface color with subtle gradient
- Border radius: 16
- Padding: md
- NO drop shadow for list items
- Press state: Slight scale (0.98) + opacity (0.9)

**Stat Cards:**
- Background: Gradient (Primary Start → Primary End) or solid Surface
- Border radius: 20
- Padding: lg
- White text for gradient cards

**Floating Action Button (FAB):**
- Size: 64x64
- Background: Gradient (Primary Start → Primary End)
- Icon: Camera (white, 28pt)
- Position: Bottom-right, 16pt from edges
- **Drop shadow:** shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Press state: Scale to 0.95

**Charts:**
- Use react-native-chart-kit or victory-native
- Colors: Primary gradient for main data, Secondary for comparisons
- Smooth animations on load

**Transaction List Items:**
- Clean card design with left accent (green for paid, amber for pending)
- No shadow, subtle border
- Swipe actions: Mark as Paid (left swipe)

### Visual Feedback
- All touchable elements have press opacity (0.7) or scale animation
- Loading states with skeleton screens
- Success animations after scanning/saving
- Haptic feedback on important actions (scan capture, save)

### Required Assets
1. **Business-themed avatar preset:** Professional icon (handshake, briefcase, or office building) in app's color scheme
2. **Card frame overlay:** SVG with rounded corners and guide markers for camera scanner
3. **Empty state illustrations:**
   - No customers yet (welcome illustration)
   - No transactions (empty folder icon)
   - Scan first card (camera with card illustration)

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio ≥ 4.5:1 for text
- Support for Dynamic Type
- VoiceOver labels for all interactive elements
- Camera permission explanations
# Design System and UI Reference

## 1. Source of design truth

The `OUTPUT SCREENSHORTS.docx` contains low-resolution images embedded in the Skill Wallet workspace. These are the available visual references; the source documents do not provide a complete design-system specification with exact pixel values, fonts or a color palette. Therefore the rules below separate observed UI patterns from proposed consistency rules.

The original reference images are preserved under `reference-assets/output-screenshots/`. Review them directly before design changes. They are blurry workspace/document captures, not clean source design files.

## 2. Observed page structure

- User registration and login pages with form fields and prominent primary actions.
- Customer dashboard containing a room card with an image, details and a booking action.
- Admin dashboard with a colored horizontal/tab header and multiple data views.
- Booking view using cards with visually distinct status badges.
- All Rooms view using a table of room records and availability/status values.
- Add Room view using a labeled form.
- All Users view using a table.

The architecture/feature document specifies `MDBTabs` for admin tab navigation and describes a gradient navbar. The reference screenshots show a strong blue/purple accent area. Exact color tokens and typography are not defined in the source.

## 3. Proposed visual rules

These are implementation suggestions to create consistency; they are not claims about exact colors/fonts in the original screenshots.

- Use a clean, hospitality-oriented interface with room photography, readable typography, and restrained blue/purple accents aligned with the screenshot.
- Use one spacing scale and consistent card, input, button and table styling.
- Keep the home page visually welcoming and make the room booking call to action obvious.
- Keep admin views dense enough for tables but avoid cramped cells or unreadable labels.
- Use clear status chips for Active and Cancelled; color must be accompanied by text, not color alone.
- Prefer reusable components: Navbar, Footer, RoomCard, FormField, BookingCard/BookingRow, StatusBadge, ProtectedRoute, AdminTabs, EmptyState and ErrorMessage where useful.
- Keep mobile navigation and forms usable without horizontal overflow.
- Use supplied room screenshots/photos only when present/authorized. If seed image URLs are used, make clear they are demo images and ensure broken images have a fallback.

## 4. Screen inventory

### Public Home
- Navigation to Home, Login and Sign Up.
- Hero/room highlights carousel.
- About section.
- Room preview cards.

### Registration
Source fields: name, email, password, confirm password, phone, user type. The role-selection security conflict is pending review in `DECISIONS_AND_CONFLICTS.md`.

### Login
- Email and password.
- Visible success/failure feedback.
- Role-appropriate dashboard redirect.

### Customer Dashboard
- Personalized greeting.
- Rooms / My Bookings / Logout navigation.
- Room cards with type, price, details, image and booking action.

### Booking selection/form
- Arrival/from and departure/to date selection.
- Room/price information and total.
- Clear unavailable/invalid-date messages.
- Simulated payment/confirmation unless the owner approves a provider integration.

### My Bookings
- Booking ID, room type, date range, total amount, phone, status.
- Cancel button for eligible bookings.

### Admin Dashboard
- Greeting and logout.
- Four tabs: All Bookings, All Rooms, Add Room, All Users.
- Booking status cards/table; room inventory table; Add Room form; users table.

## 5. Interaction states

All data-driven screens should consider: initial loading, loaded data, empty list, validation error, server/API error, unauthorized access, and success feedback. Buttons should show disabled/pending states while an operation is in progress. Errors should explain a corrective action where possible.

## 6. Accessibility and responsive behavior

- Give every input a visible label.
- Keep keyboard focus visible.
- Make button/link targets distinguishable and navigable.
- Maintain readable contrast and text sizes.
- Use table headers for data tables.
- Use status text along with color.
- Test around 375px mobile width and desktop. These viewport values are proposed verification points, not source requirements.

## 7. Visual acceptance checklist

- [ ] Layout resembles the supplied reference areas without inventing unrelated screens.
- [ ] Admin tab names and page purposes match the documentation.
- [ ] Room cards show image, type, price and relevant details.
- [ ] Booking state is clear and consistent across dashboard/history.
- [ ] Forms are labelled, validated and readable on mobile.
- [ ] No fake metrics or controls that do nothing.

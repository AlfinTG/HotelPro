# User Flows — Hotel Management

These flows consolidate the hotel-specific descriptions from the course User Flow, Features, Roles and Responsibilities, and Output Screenshots documents. Exact endpoint naming differences remain in `API_SPEC.md` and `DECISIONS_AND_CONFLICTS.md`.

## 1. Visitor flow

1. Visitor opens Home.
2. Home provides Home, Login and Sign Up navigation.
3. Visitor can view room highlights/carousel, About information and room previews.
4. Visitor chooses Sign Up or Login.

## 2. Registration flow

**Source fields:** Name, Email, Password, Confirm Password, Phone, User Type (Admin/Ordinary).

1. User fills required fields.
2. Form validates required values and matching passwords.
3. Client sends a POST request to `/SignUp` as named in the source flow.
4. Backend rejects invalid data or duplicate email, hashes the password and creates the account.
5. On success, show a confirmation and direct the user to Login.

**Decision note:** the visible User Type selector is explicitly named by the source, but an arbitrary public request must not grant admin permissions. See D-06 in `DECISIONS_AND_CONFLICTS.md` before implementation.

## 3. Login flow

1. User enters Email and Password.
2. Client submits a POST request to `/Login` as named in the source flow.
3. Backend verifies credentials and issues JWT on success.
4. Client stores the token and safe user details using the documented session approach.
5. Authorized admin goes to AdminHome; ordinary customer goes to UserHome.
6. Invalid credentials show an error and do not create an authenticated session.

## 4. Customer dashboard flow

- Show a personalized greeting, e.g. `Hi, {user name}`.
- Provide navigation to Rooms, My Bookings and Logout.
- Room list uses data from the room retrieval operation referenced as `GetRooms` in source notes.
- Room card shows image/photo, room type, price/rent and details/features.

## 5. Booking flow

1. Customer browses rooms and selects arrival/from date and departure/to date.
2. System shows relevant room type and price.
3. Backend validates date order, room existence and availability for the selected interval.
4. Backend calculates total duration and amount and creates a booking.
5. Payment is mentioned by the source. Until a real provider is named, a simulated payment/confirmation is the safe proposed course-demo path.
6. Booking appears in My Bookings with ID, room type, from/to dates, total amount, customer phone and status.

## 6. Cancellation flow

1. Customer opens My Bookings.
2. A cancel action is shown for an eligible booking whose status is not `cancelled`.
3. Client submits the cancellation request using `/cancelbooking` as named in the source.
4. Backend verifies authentication, booking ownership and current status.
5. Backend changes the persisted status; UI shows the updated `Cancelled` state.

## 7. Admin flow

1. An authorized administrator logs in and reaches AdminHome.
2. Dashboard shows an admin greeting and Logout.
3. Admin selects one of four tabs:
   - **All Bookings:** view customer bookings and status.
   - **All Rooms:** view available room inventory.
   - **Add Room:** enter room attributes such as type, price/rent, photos, room number and description, then save.
   - **All Users:** view registered users.
4. Room changes must persist and appear in All Rooms after refresh.
5. Admin-only endpoints must reject ordinary customer accounts.

## 8. Logout flow

1. User clicks Logout.
2. Client removes local session/token state.
3. Application redirects to Home.
4. Protected pages/APIs are unavailable unless the user signs in again.

## 9. Main error/edge flows

- Required signup field missing or passwords mismatch.
- Duplicate email.
- Invalid login.
- Missing/expired JWT.
- Customer tries to use admin endpoint.
- Customer requests or cancels another user's booking.
- Invalid/reversed date interval or unavailable room.
- Repeated cancellation request.
- Backend/database error or empty room/booking/user list.

Every failure should be visible and understandable; do not fake a successful operation when the API failed.

# API Specification — Hotel Management

## 1. Status

The source documents mention several paths explicitly, but do not provide a complete, consistent API contract. This document distinguishes **paths named in the source** from **proposed coverage** needed to implement all documented UI features. The coding agent must inspect this table and `DECISIONS_AND_CONFLICTS.md` before coding routes.

## 2. Paths explicitly named in the source documents

| Path as written | Method described | Purpose described | Confidence |
|---|---|---|---|
| `/SignUp` | POST | Create an account | Explicit in User Flow |
| `/Login` | POST | Authenticate user | Explicit in User Flow |
| `GetRooms` | Method not specified in text | Fetch room data for listing | Named as the source of room list; exact leading slash/method not stated |
| `/cancelbooking` | POST | Cancel a booking/update status | Explicit in User Flow |
| `/user` | Route mount shown in backend screenshot | User-related routes | Screenshot example; exact child routes not visible in text |
| `/reports` | Route mount appears in backend screenshot | Report routes | Likely a generic tutorial/example; not a confirmed hotel business requirement |

Do not treat the incomplete `/reports` snippet as a requirement to build a reports subsystem.

## 3. Required logical API capabilities

The methods below are a proposed minimum to fulfill the documented user journeys. Where the source did not specify an exact path/method, the endpoint naming is a proposal, not a quoted requirement.

| Capability | Proposed method/path | Access | Notes |
|---|---|---|---|
| Register | `POST /SignUp` (source path) | Public | Validate required fields and duplicate email; role assignment conflict is listed separately |
| Login | `POST /Login` (source path) | Public | Returns JWT and safe user fields |
| Public/available room list | `GET /GetRooms` (normalized method proposal) | Public or authenticated per chosen flow | Supply both `fromDate` and `toDate` together for availability filtering, or supply neither for the full room list; active Booking records and embedded slots are both checked |
| Room detail | `GET /api/rooms/:id` | Public | Proposed helper endpoint if the UI needs it |
| Create room | `POST /api/rooms` | Admin | Source describes creating a Room from request body then saving |
| Admin room list | `GET /api/admin/rooms` or shared rooms route | Admin | Must support All Rooms tab |
| Current user's bookings | `GET /api/bookings/mine` | Customer | Proposed path; only current user's records |
| Create booking | `POST /api/bookings` | Customer | Required by documented booking flow; exact path not supplied |
| Cancel booking | `POST /cancelbooking` (source path) | Booking owner / authorized admin if explicitly implemented | Validate ownership and status |
| All bookings | `GET /api/admin/bookings` | Admin | Required for All Bookings tab |
| All users | `GET /api/admin/users` | Admin | Required for All Users tab; never return password hashes |

If a consistent `/api` prefix is selected for new endpoints, keep the explicitly documented paths available or document an intentional compatibility mapping. Do not silently rename `/SignUp`, `/Login`, or `/cancelbooking` when the source/rubric may expect them.

## 4. Request/response principles

- JSON is the default request/response format unless file upload is implemented.
- Validate all inputs server-side, even when frontend validation exists.
- Do not return password, password hash, confirm password, JWT secrets, or card details in API responses.
- Use consistent response codes and a stable JSON error shape, e.g. `{ "message": "..." }`, without leaking stack traces.
- Calculate `totalDays` and `totalAmount` on the server.
- On booking creation, verify the room exists, dates are valid, and the requested interval is available in both active Booking records and embedded Room.currentBookings slots.
- Public room responses must omit internal `currentBookings` reservation slots.
- Room availability filters must provide both `fromDate` and `toDate`, or neither; reject partial date ranges with HTTP 400.
- For cancellation, verify the booking exists, belongs to the authenticated user (for customers), and is not already cancelled.
- For room creation and admin lists, enforce administrator authorization on the backend.

## 5. Suggested status codes

| Condition | Status |
|---|---:|
| Successfully created | 201 |
| Successfully read/updated/cancelled | 200 |
| Invalid request fields/date range | 400 |
| Missing/invalid authentication | 401 |
| Authenticated but forbidden | 403 |
| Record not found | 404 |
| Duplicate email or conflicting room/booking condition | 409 |
| Unexpected server failure | 500 |

These are implementation recommendations; the source material does not define numeric HTTP status codes.

## 6. Authentication format

For protected endpoints, use the chosen JWT transport consistently. If using an `Authorization: Bearer <token>` header, require the server to validate signature and expiry and attach the authenticated identity/role to request context. Do not trust a user ID or role copied from the client body as proof of identity.

## 7. API acceptance checks

- Valid signup creates one user with a password hash.
- Duplicate signup is rejected.
- Valid login returns a token; invalid credentials are rejected.
- Missing/invalid tokens cannot reach protected APIs.
- Customer cannot create rooms or access all users/all bookings endpoints.
- A booking can only be created when dates and availability are valid.
- A customer sees only their own booking history and cannot cancel another user's booking.
- Admin tabs load data from persisted records, not hardcoded UI arrays.

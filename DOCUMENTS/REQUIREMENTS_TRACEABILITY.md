# Requirements Traceability Matrix

This matrix connects source-derived requirements to likely implementation areas and proof required for acceptance. Paths are targets for the proposed structure; they are not yet existing files.

| ID | Requirement | Source basis | Target area (proposed) | Verification evidence |
|---|---|---|---|---|
| R-01 | Public landing page with navigation | User Flow, Features | `client/src/pages/Home*`, shared Navbar | Browser shows Home/Login/Sign Up and room preview/About |
| R-02 | Room highlight carousel | Features, User Flow | Home page component | Carousel works and does not break mobile layout |
| R-03 | Registration form | User Flow, Features | Signup page + auth route/controller | Valid registration persists one user |
| R-04 | Required-field and confirm-password validation | User Flow | Signup component + backend validation | Invalid/mismatched form is rejected |
| R-05 | Duplicate email rejected | Backend example | User model/auth controller | Second signup with same email receives controlled conflict |
| R-06 | Password hashing | Backend example/security needs | Auth controller/model utilities | Database value is a hash, not submitted password |
| R-07 | Login and JWT | User Flow, Features | Login page + auth controller/middleware | Valid login succeeds; invalid login fails; protected route denies missing token |
| R-08 | Role-appropriate dashboards | User Flow | route guard + dashboard pages | Customer/admin land on correct dashboard; backend role tests pass |
| R-09 | Browse rooms with details/photos/prices | Features, ER Diagram | room API + RoomCard/list | Cards display persisted room data |
| R-10 | Select from/to dates | Roles, User Flow | booking form + booking API | Date validation and availability query work |
| R-11 | Create booking | Roles, User Flow | booking controller/model/API | Record persists and appears in history |
| R-12 | Booking history fields | Features | My Bookings page + API | ID, room type, dates, amount, phone and status appear |
| R-13 | Cancel booking | User Flow names `/cancelbooking` | cancellation controller/API | Status updates; ownership and state validated |
| R-14 | Admin All Bookings | Features, Output Screenshots | Admin tab/API | Shows persisted bookings and status |
| R-15 | Admin All Rooms | Features, Output Screenshots | Admin tab/room API | Shows current rooms/inventory |
| R-16 | Admin Add Room | Backend Development, Features | form + protected room-create API | Room saves and appears in room list after refresh |
| R-17 | Admin All Users | Features, Output Screenshots | tab + admin users API | Displays safe user fields, never password hashes |
| R-18 | Responsive interface | Features | CSS/component layout | Check desktop and narrow mobile viewport |
| R-19 | MongoDB/Mongoose persistence | Database docs | server config/models | app starts with valid Mongo URI and records persist |
| R-20 | README/run instructions | Execution/Setup docs | README | Clean setup followed by a second person or fresh environment |
| R-21 | Source screenshot fidelity | Output Screenshots | UI implementation | Compare each screen against supplied reference images |
| R-22 | Payment step represented | Overview, Roles, ER Diagram | booking flow | Demo payment/confirmation works; no raw card/CVV is persisted |
| R-23 | GitHub submission | Course goal stated by owner | repo root/Git workflow | Final code visible in GitHub and repo can be cloned |
| R-24 | Demo video submission | Course goal stated by owner | `DEMO_AND_SUBMISSION.md` | Uploaded video link opens and is submitted in Skill Wallet |

## Completion reporting

For each requirement, use one state: **Not started**, **In progress**, **Implemented**, **Verified**, or **Deferred with owner approval**. “Implemented” means code exists; “Verified” means the documented check was actually run and passed. Never mark a row Verified based on code generation alone.

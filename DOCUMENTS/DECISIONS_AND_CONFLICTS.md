# Source Conflicts and Decision Register

## 1. Why this document exists

The original materials were assembled from copied course notes, screenshots and implementation examples. Some details are inconsistent. This register preserves those source details and makes proposed normalization explicit. Do not silently choose one value and later claim the source was unanimous.

## 2. Source-of-truth order

Unless the project owner states otherwise:

1. Current explicit instruction from the owner.
2. Hotel-specific feature/user-flow/ER/architecture documents and output reference screenshots.
3. Detailed hotel backend and setup steps.
4. Generic code snippets embedded in copied instructional material.
5. Proposed defaults in this register.

Security safeguards such as protecting secrets and not persisting raw card/CVV data still apply. If a source requirement materially conflicts with safe implementation, raise the conflict and preserve it in this log.

## 3. Conflicts and proposed defaults

### D-01 — Product name

- **Source evidence:** `Overview.docx` and the Skill Wallet workspace title use **HotelPro**. `OUTPUT SCREENSHORTS.docx` conclusion uses **Roomly**.
- **Proposed default:** use **HotelPro** as the UI/README project name because it is used in the overview and workspace title.
- **Status:** proposed; owner can change it before the UI is built.

### D-02 — Folder naming

- **Source evidence:** setup text uses `Client`/`Server`; execution instructions use lowercase `client`/`server` and commands `cd client` / `cd ../server`.
- **Proposed default:** lowercase `client/` and `server/` folders to match common paths and explicit execution commands.
- **Status:** proposed.

### D-03 — Backend entry point

- **Source evidence:** `SERVER SETUP.docx` says create `server.js`; detailed Backend Development and execution steps say `index.js` and use `nodemon index.js`.
- **Proposed default:** use `server/index.js` as the entry point, because the detailed backend and execution instructions both reference it.
- **Status:** proposed.

### D-04 — Backend port

- **Source evidence:** execution guide explicitly says backend runs on `http://localhost:8001`; the embedded code screenshot was previously read as showing a different port (8000).
- **Proposed default:** use port `8001`, controlled by `PORT` in server `.env`, with README updated to match the actual application.
- **Status:** proposed; confirm from readable source if exact screenshot value is important.

### D-05 — MongoDB database name/URI

- **Source evidence:** execution guide says `mongodb://localhost:27017/hotel`; database connection notes show `Roomly`; backend screenshot appears to show `DARK`.
- **Proposed default:** local URI `mongodb://127.0.0.1:27017/hotel` in server `.env.example`.
- **Status:** proposed. Use the actual configured URI in the final README; never commit real remote credentials.

### D-06 — User role field and admin registration

- **Source evidence:** the User entity uses `type`; feature/user-flow instructions mention a required User Type selector with `Admin/Ordinary`; backend screenshot includes a role-like field, and other text says Admin/Customer.
- **Security constraint:** public signup must not grant administrator privileges solely because the client posts `type: "admin"`.
- **Proposed implementation:** canonical field `role`, values `admin` and `customer`; public registration creates a customer by default. A trusted seed/provisioning method creates the admin account. If the course evaluator requires a visible selector, preserve the field visually only after owner review and ensure the backend still does not trust an arbitrary admin choice.
- **Status:** material decision for owner confirmation. Do not quietly claim this behavior exactly matches the source's role-selector wording.

### D-07 — User profile fields

- **Source evidence:** ER diagram lists `name`, `email`, `password`, `c_password`, `phone`, `type`; embedded schema screenshot includes fields that appear to include `number`, `email`, `password`, `gender`, `age`, `role` (the text is low resolution); feature list asks for name, email, password, phone and user type.
- **Proposed default:** use hotel-specific requirements: `name`, `email`, password hash, `phone`, and role. Confirm whether `gender` or `age` are actually required before implementing; they are not required by the feature/user-flow list.
- **Status:** proposed.

### D-08 — Room attributes and inventory semantics

- **Source evidence:** Room includes `roomNumber`, `description`, `photos`, `type`, `rent`, `count`, and `currentBookings`; Roomly/user-flow text describes bookings by arrival/departure dates.
- **Ambiguity:** `count` may mean number of available units for a room type, while `roomNumber` suggests a physical room record. Overlap rules differ for these two models.
- **Proposed default:** for an MVP, model the available room data clearly and enforce date-overlap checks. Decide whether each record is a physical room or a room type with quantity before finalizing the schema.
- **Status:** material modeling decision; inspect requirements/ask owner if one exact semantics must be reproduced.

### D-09 — Booking date and amount fields

- **Source evidence:** source uses `fromdate`, `todate`, `totaldays`, `totalAmount`; naming/style differs in other examples.
- **Proposed default:** use camelCase internally (`fromDate`, `toDate`, `totalDays`, `totalAmount`) and ensure API/UI are consistent. Calculate duration and amount on the server.
- **Status:** proposed; visible behavior must match source labels.

### D-10 — API route names

- **Source evidence:** user-flow calls `POST /SignUp`, `POST /Login`, mentions `GetRooms`, and specifies `POST /cancelbooking`. Backend screenshot includes generic `/user` and `/reports` mounts. Some route method/leading-slash details are not explicit.
- **Proposed default:** preserve `/SignUp`, `/Login`, and `/cancelbooking` in the implementation; resolve exact method/path for room list in code and document it. Do not create a reports feature only because a generic screenshot includes it. New routes needed for admin APIs should be documented as proposals.
- **Status:** proposed.

### D-11 — UI libraries

- **Source evidence:** frontend notes list React, Bootstrap, Material UI, Axios, Ant Design, `mdb-react-ui-kit`, and `react-bootstrap`. The feature doc specifically names MDBTabs and a gradient navbar.
- **Proposed default:** use React/Vite, Axios, and one primary UI/styling approach; use MDBTabs if it can be installed and built reliably because it is explicitly named for the admin interface. Do not pull in every listed library unless the source requires the component.
- **Status:** proposed implementation simplification; preserve the documented tabs and appearance.

### D-12 — Payment and CardDetails

- **Source evidence:** product overview mentions payment processing; role description says a user needs to pay; ER diagram lists raw card fields.
- **Security constraint:** never save raw card number or CVV in the application's database/logs.
- **Proposed default:** provide a simulated payment confirmation for course demonstration unless a specific real provider is required. Record safe payment status/reference only.
- **Status:** recommended safety adaptation; obtain owner confirmation if real payment is part of the course rubric.

### D-13 — Generic copied material

- **Source evidence:** frontend instructions contain students/instructors/courses/products/orders, and overview hardware text mentions patient/admin/doctor.
- **Interpretation:** these appear to be copied generic setup examples and conflict with the hotel-specific scope.
- **Proposed default:** do not implement these unrelated entities/routes. Use hotel-specific User, Room, Booking and the defined dashboard features.
- **Status:** recommended based on repeated hotel-specific materials.

## 4. Must-confirm decisions before final build

1. Confirm display name: HotelPro (recommended) or Roomly.
2. Confirm whether the registration UI must visibly show an Admin/Ordinary type selector. Regardless, backend must not trust a public role field to grant admin permissions.
3. Confirm room inventory meaning: one record per physical room or one record per room type with `count` inventory.
4. Confirm if the course explicitly requires real payment integration or simulated payment is acceptable.

For all other inconsistencies, the proposed default can be used if the owner does not have a stricter rubric requirement. Update this register when a decision is made; do not delete the source evidence.

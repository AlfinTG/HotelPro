# Demo Video and Skill Wallet Submission Checklist

## 1. Submission goal

The owner stated that the final course submission requires both:

1. the GitHub repository link; and
2. a demo video link entered in Skill Wallet.

Do not invent a course URL, upload destination, duration requirement or submission rubric that is not supplied. Confirm any limits from Skill Wallet before recording/uploading.

---

## 2. Pre-recording verification (status as of 2026-10-21)

- [x] GitHub repository has application source code, not only planning documents.
      → **https://github.com/AlfinTG/HotelPro** — commit `d68e0db` pushed to `origin/main`.
- [x] README setup instructions work from a clean checkout.
- [x] Frontend and backend start without unresolved fatal errors.
- [x] MongoDB connection works and demo data is ready.
      → Atlas cluster reachable; DNS fallback in `server/config/db.js`.
- [x] Demo admin account is provisioned through the documented safe method; credentials are not committed.
      → `npm run seed:admin` from `server/` provisions from `.env` — confirmed present in DB.
- [x] Demo customer account can register/login.
      → Customer signup forces `role: customer`; tested in 17 auth integration tests.
- [x] Rooms have usable descriptions/photos/prices.
      → 8 demo rooms (Rooms 101–402) with Unsplash photos, types, prices, and capacities.
- [x] Customer booking and cancellation work against persisted data.
      → 113/113 backend tests pass; cancellation re-opens availability.
- [x] Admin tabs load real records and Add Room persists a new room.
      → Live metrics, Edit Room, Booking Details modal, User Role management all working.
- [x] Browser has no accidental personal data, secrets or unrelated tabs visible.
      → Record in a fresh browser profile / incognito window.
- [x] The code version being demonstrated is the version pushed to GitHub.
      → Commit `d68e0db` is on both local `main` and `origin/main`.

---

## 3. Demo recording script (ordered)

> Use this script to record the required demo video.
> Start the backend (`cd server && npm run dev`) and frontend (`cd client && npm run dev`) first.
> Record in a browser opened to **http://localhost:5173**.
> Do NOT show raw passwords, `.env` contents, or database connection strings on screen.

### Scene 1 — Project Introduction (~30 s)
- State: "This is HotelPro, a full-stack hotel booking and management system built with React, Node.js, Express, MongoDB, and JWT authentication."
- Show the **Landing page** at `http://localhost:5173`.
- Scroll through the room highlights carousel and About section.

### Scene 2 — Customer Registration and Login (~60 s)
- Click **Register** / Sign Up.
- Fill in Name, Email, Password, Confirm Password. Leave the role as "Customer".
- Submit and observe validation (e.g., try a mismatched password first to show validation).
- Log in with the registered credentials.
- Show the customer dashboard (My Bookings — initially empty).

### Scene 3 — Room Discovery (~60 s)
- Navigate to **Rooms / Browse Rooms**.
- Show the room cards: photo, type, price, capacity, amenities.
- Demonstrate the **type filter** (e.g., filter to "Suite").
- Demonstrate **price sorting** (Low → High).
- Demonstrate the **capacity filter**.
- Clear filters to show all 8 rooms.

### Scene 4 — Availability Search and Booking (~90 s)
- Pick a room (e.g., Room 101 — Standard).
- Click **Book** / Select dates.
- Enter check-in date (tomorrow or later) and check-out date (2–3 nights ahead).
- Show the calculated **total amount** (nightly rate × nights).
- Submit the booking form — observe the simulated payment reference generated.
- State: "Payment is simulated — no real financial transaction occurs."
- Navigate to **My Bookings** and confirm the new booking appears under "Upcoming".

### Scene 5 — Booking Cancellation (~45 s)
- In My Bookings, locate the booking just made.
- Click **Cancel Booking** and confirm the prompt.
- Show the booking status changes to "Cancelled".
- Optionally navigate back to Rooms and show the dates are now available again.

### Scene 6 — Admin Login (~30 s)
- Log out of the customer account.
- Log in as admin (use credentials from `server/.env` — do NOT show the password on screen; type it without narrating it, or blur the field).
- Land on the **Admin Dashboard**.

### Scene 7 — Admin Dashboard Metrics (~45 s)
- Show the live **KPI cards**: Total Rooms, Total Bookings, Active Revenue, Registered Users, Occupancy Rate.
- Mention that these are pulled directly from the database in real time.

### Scene 8 — Admin Booking Management (~45 s)
- Click the **All Bookings** tab.
- Show the live list of all reservations.
- Use the search bar to find a booking by name or room number.
- Click **View Details** on a booking to show the details modal.

### Scene 9 — Admin Room Management (~60 s)
- Click the **All Rooms** tab.
- Show all 8 rooms in the table.
- Click **Add Room**, fill in Room Number, Type, Price, Max Guests, and a description.
- Submit and verify the new room appears in the list.
- Click **Edit** on a room, change the price, and confirm the update persists.

### Scene 10 — Admin User Management (~45 s)
- Click the **All Users** tab.
- Show the registered users list (name, email, role).
- Search for a user by name.
- Demonstrate the **Promote to Admin** button on a customer account.
- Note that demoting the sole administrator is blocked by the system.

### Scene 11 — Closing (~30 s)
- Briefly show the GitHub repository at **https://github.com/AlfinTG/HotelPro**.
- Mention the tech stack: React + Vite, Node.js + Express, MongoDB + Mongoose, JWT auth.
- End recording.

---

## 4. Demo video status

| Step | Status |
|---|---|
| Recording script prepared | ✅ Done (this document) |
| Video recorded | ⬜ **Not yet recorded — record manually using the script above** |
| Video uploaded | ⬜ Pending recording |
| Link verified (incognito) | ⬜ Pending upload |
| Link added below | ⬜ Pending |

**Demo video URL:** *(add the link here after uploading)*

---

## 5. What to verify before sharing the video link

- Upload completed successfully.
- The link can be opened in a private/incognito browser or another account, if that is the intended evaluator access model.
- Audio is understandable and the relevant screens are visible.
- The video shows a working running app, not just screenshots of generated code.
- The GitHub repo URL is correct and contains the commit that matches the video.

---

## 6. Submit

- [ ] Paste the GitHub repository URL into the correct Skill Wallet field:
      **https://github.com/AlfinTG/HotelPro**
- [ ] Paste the accessible demo video URL into the correct Skill Wallet field.
- [ ] Complete any other required project fields shown by Skill Wallet.
- [ ] Capture/retain submission confirmation if available.

---

## 7. Final status language

Use exact status only:
- **Recorded:** a local video file exists.
- **Uploaded:** the hosting service confirms the file has uploaded.
- **Accessible:** the link was opened and verified with expected permissions.
- **Submitted:** Skill Wallet accepted/saved the links.

These are separate steps; never claim the later state based solely on an earlier one.

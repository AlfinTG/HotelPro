# HotelPro / Hotel Management — Project Documentation

> **Purpose:** A professional, self-contained specification pack for the Hotel Management full-stack course project. These documents guide ChatGPT Project, Google Antigravity, implementation, verification, and the final Skill Wallet submission.

## Current status

This repository pack is **documentation and reference material**, not a working application. The existing `AlfinTG/HotelManagement` repository was inspected and was found to contain project documentation rather than application source code. No feature should be described as implemented until code is created and verified.

## Product summary

The course documents describe a MERN-stack hotel booking and management application. The overview and Skill Wallet workspace screenshots use the name **HotelPro**; one output conclusion uses **Roomly**. The feature set includes a public landing page, registration/login, room browsing, date-based booking, booking history and cancellation, plus an administrator dashboard with **All Bookings**, **All Rooms**, **Add Room**, and **All Users** tabs.

The intended stack is React with Vite, Node.js, Express, MongoDB/Mongoose, Axios, JWT authentication, and password hashing. MDB React UI Kit is specifically referenced for the tabbed admin interface. See `DECISIONS_AND_CONFLICTS.md` for differences in the original notes that must not be silently erased.

The source overview records a Skill Wallet workspace total of **6 epics, 19 stories/tasks, and 0 subtasks**; it also says no mentor was assigned at the time of capture. These are course-workspace tracking details, not application features, and may change independently of the implementation.

## Read these documents first

Recommended reading order:

1. `PROJECT.md` — compact agent-oriented brief.
2. `SOLUTION_OVERVIEW.md` — what we're building and why.
3. `PRD.md` — user-facing requirements and acceptance criteria.
4. `DECISIONS_AND_CONFLICTS.md` — source inconsistencies and proposed defaults.
5. `ARCHITECTURE.md` and `DATABASE.md` — application structure and data model.
6. `USER_FLOWS.md` and `API_SPEC.md` — exact user journeys and API coverage.
7. `SECURITY.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`, and `TESTING.md` — implementation constraints.
8. `SETUP_AND_DEVELOPMENT_GUIDE.md` and `GIT_WORKFLOW.md` — workflow.
9. `AGENTS.md` and `CHATGPT_PROJECT_INSTRUCTIONS.md` — persistent AI context/rules.
10. `PROMPTS.md`, `CREATE_PROMPT.md`, and `INSTALL_PROMPT.md` — agent prompt usage.
11. `REQUIREMENTS_TRACEABILITY.md` and `DEMO_AND_SUBMISSION.md` — final completeness and submission checklist.

## Documentation map

| File | Purpose |
|---|---|
| `PROJECT.md` | Compact project brief and implementation order |
| `PROMPTS.md` | Map of ChatGPT/Antigravity prompt files and reusable prompt template |
| `SOLUTION_OVERVIEW.md` | Human-readable product concept and user journey |
| `PRD.md` | Functional/non-functional requirements and acceptance checks |
| `USER_FLOWS.md` | Visitor, authentication, booking, cancellation and admin flows |
| `ARCHITECTURE.md` | Proposed MERN/MVC application boundaries and structure |
| `DATABASE.md` | Source-derived entities, attributes, relationships, and safe implementation notes |
| `API_SPEC.md` | API paths named in the source documents plus clearly marked proposed coverage |
| `SECURITY.md` | Authentication, authorization, data protection, and payment constraints |
| `TESTING.md` | Test layers and end-to-end demo cases |
| `DESIGN_SYSTEM.md` | Visual guidance derived from the supplied output screenshots and UI notes |
| `CODE_STYLE.md` | Coding conventions for a simple, maintainable student project |
| `DECISIONS_AND_CONFLICTS.md` | Source-of-truth register; unresolved differences stay visible |
| `REQUIREMENTS_TRACEABILITY.md` | Links requirements to implementation areas and verification |
| `SETUP_AND_DEVELOPMENT_GUIDE.md` | Human guide for implementation and local run workflow |
| `GIT_WORKFLOW.md` | Branching, commits, review, and repository hygiene |
| `TEAM_WORKFLOW_PROMPT.md` | Shared working rules if more than one contributor is involved |
| `AGENTS.md` | Persistent instructions for coding agents |
| `CHATGPT_PROJECT_INSTRUCTIONS.md` | Copy-ready instructions for the new ChatGPT Project |
| `CREATE_PROMPT.md` | Copy-ready prompt to build the application in Antigravity |
| `INSTALL_PROMPT.md` | Copy-ready prompt to configure, run, test, and verify the application |
| `DEMO_AND_SUBMISSION.md` | Demo-video flow and Skill Wallet submission checklist |

`.gitignore` is a starter hygiene file for the future app implementation. `HotelPro_Solution_Overview.docx` and `HotelPro_Solution_Overview.pdf` are reading copies of the product overview. `reference-assets/` preserves the embedded screenshot materials supplied with the source documents; the screenshots are reference evidence, not proof of a finished application.

## Source-of-truth rule

The user-provided Hotel Management documents and screenshots define the requested scope. When they disagree, record the mismatch in `DECISIONS_AND_CONFLICTS.md`. Do not quietly invent a decision, remove a documented feature, claim an unverified behavior exists, or copy unrelated generic course content into this hotel project. The proposed defaults are explicit implementation suggestions and remain reviewable by the project owner.

## Project-wide definition of done

The project is ready for course submission only when:

- the customer and admin flows work against the backend and database;
- key forms validate input and protected operations enforce roles on the server;
- room creation, date-based availability, booking, history, and cancellation are demonstrated;
- setup steps have been tested from a clean checkout;
- the final GitHub repository contains the implementation and clear README instructions;
- the demo video is actually recorded, uploaded, and its link is accessible;
- the GitHub and demo-video links have both been submitted in Skill Wallet.

Do not confuse a polished documentation pack or generated code with a verified working application.

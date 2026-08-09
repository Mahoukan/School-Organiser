# School Timetable Organiser

## Master Product Specification

### 1. Product Overview

The School Timetable Organiser is a private teacher-focused web application for managing a repeating school timetable, planning individual lessons, recording what happened in previous lessons, managing absences and timetable changes, and viewing upcoming teaching commitments.

The application is designed initially for a single teacher, but its architecture must support future rollout to multiple teachers with separate private accounts.

The application will use a two-week timetable cycle consisting of **Week A** and **Week B**.

The key principle is that the recurring timetable and individual lesson occurrences are separate.

A recurring timetable entry may state:

`10DGT normally occurs during Week A Monday Period 2.`

An actual lesson occurrence may be:

`10DGT on Monday 17 August 2026 during Period 2.`

That lesson occurrence can then independently contain a lesson plan, cancellation, movement, status or other change without modifying the recurring timetable.

---

# 2. Technology Stack

The initial application will use:

* Next.js
* React
* JavaScript
* Standard CSS
* PostgreSQL
* Git
* GitHub
* Railway

Development will take place in VS Code.

The project should avoid unnecessary frameworks and libraries during early development.

TypeScript and Tailwind CSS will not be required initially.

An ORM may be introduced when database persistence is implemented.

The application will be stored in a GitHub repository and eventually deployed through Railway.

---

# 3. Core Application Areas

The primary navigation will contain:

1. Today
2. Timetable
3. Classes
4. Calendar
5. Setup
6. Settings

Desktop layouts should use a sidebar or similarly persistent navigation.

Mobile layouts should use an appropriate compact navigation pattern.

---

# 4. User Model

The initial application will have one user.

However, all user-owned data must be associated with a user internally so that future multi-user support does not require restructuring the application.

Examples of user-owned information include:

* classes
* timetable entries
* lesson plans
* personal events
* absences
* lesson history

Future teachers must not automatically have access to another teacher's information.

---

# 5. Future Roles

The system should be designed so that two roles can eventually exist:

## Teacher

Teachers can manage:

* their classes
* their personal timetable
* lesson plans
* lesson statuses
* absences
* events
* one-off timetable changes

## Administrator

Administrators can additionally manage:

* academic years
* term dates
* teaching weeks
* Week A / Week B allocation
* daily period structures
* holidays
* school-wide closures
* general timetable configuration

During the initial single-user version, the user effectively has both roles.

---

# 6. Academic Year

All timetable information should belong to an academic year.

Example:

`2026`

Classes should also belong to an academic year so that:

`10DGT 2026`

and:

`10DGT 2027`

are treated as separate class records.

School-year rollover functionality will not be implemented in Version 1, but the database must support it later.

---

# 7. Terms and Teaching Weeks

An academic year contains terms.

Each term contains teaching weeks.

Each teaching week must explicitly identify whether it uses:

* Week A
* Week B

The system must not simply alternate calendar weeks mathematically forever.

Example:

```text
Week beginning 20 July 2026 = Week A
Week beginning 27 July 2026 = Week B
Week beginning 3 August 2026 = Week A
Week beginning 10 August 2026 = Week B
```

This allows the cycle to be manually corrected where required.

School holidays should not count as teaching weeks.

---

# 8. Daily Period Structures

Period times must not be globally hard-coded.

Administrators must be able to configure the timetable structure independently for different days.

This means Monday may have different period times from Tuesday.

The system should support separate structures across the entire two-week cycle if required.

Each timetable block should support:

* name
* start time
* end time
* display order
* whether it is a teaching period
* whether it is a non-teaching block

Examples include:

* Tutor
* Period 1
* Period 2
* Interval
* Period 3
* Period 4
* Lunch
* Period 5
* Period 6

A class is assigned to a period rather than directly to a clock time.

The period configuration determines the actual displayed time.

---

# 9. Classes

Teachers can create classes.

Each class should contain:

* class name
* short code
* subject
* year level
* default room
* colour
* active/archive status
* academic year

Required fields:

* class name
* short code
* colour

Example:

```text
Class Name: Year 10 Digital Technology
Short Code: 10DGT
Subject: Digital Technology
Year Level: 10
Room: DT1
Colour: Blue
```

Classes should normally be archived rather than permanently deleted.

Archiving a class must preserve previous lesson history.

---

# 10. Recurring Timetable

Teachers can assign classes to recurring timetable slots.

A timetable assignment includes:

* class
* Week A or Week B
* weekday
* period

Example:

```text
10DGT
Week A
Monday
Period 2
```

A class may appear multiple times throughout the fortnight.

The Setup interface should provide a visual timetable editor.

Clicking available timetable cells should allow classes to be assigned.

Recurring timetable entries must be editable.

---

# 11. Permanent Timetable Changes

Permanent changes are made through Timetable Setup.

Example:

Moving:

`Week A Monday Period 2`

to:

`Week A Monday Period 3`

changes the repeating timetable pattern.

This must be treated differently from moving a single lesson occurrence.

Drag-and-drop may be used for recurring timetable editing.

---

# 12. Actual Lesson Occurrences

The system should generate the teacher's displayed timetable dynamically using:

* academic calendar
* teaching week
* Week A / Week B
* recurring timetable
* calendar exceptions
* absences
* one-off changes
* events

The system should not generate thousands of empty lesson records in advance.

An individual lesson occurrence record only needs to be stored when something unique exists for that date, such as:

* lesson plan
* title
* summary
* completion status
* movement
* cancellation
* room override

This keeps the system efficient and separates recurring schedule data from real historical teaching records.

---

# 13. Main Timetable Views

The timetable must support three viewing modes:

* Day
* Week
* Fortnight

Users should be able to switch easily between them.

Common controls should include:

* previous period/date range
* next period/date range
* Today
* Day
* Week
* Fortnight

---

# 14. Today View

The Today view should become the primary daily teaching screen.

It should show:

* current date
* current Week A / Week B status
* periods in chronological order
* classes
* free periods
* duties
* meetings
* assemblies
* other timetable events

Example:

```text
Monday 10 August
Week B

Period 1
9MAT
Quadratic Equations

Period 2
FREE

Period 3
10DGT
Introduction to Databases

Lunch
Duty – Courtyard

Period 5
12CS
Binary Trees
```

The Today view should provide quick access to lesson details.

---

# 15. Week View

The Week view should show Monday to Friday together.

Example:

```text
        MON      TUE      WED      THU      FRI

P1      10DGT    FREE     12CS     9MAT     10DGT
P2      9MAT     10DGT    FREE     12CS     9MAT
P3      ...
```

Class colours should make timetable blocks easy to distinguish.

Lesson-plan summaries may appear where space allows.

---

# 16. Fortnight View

The Fortnight view should show Week A and Week B.

Because of limited space, it can display more compact class cards.

Typical information might include:

* class short code
* room
* colour

The view should prioritise understanding the overall timetable structure rather than displaying detailed lesson plans.

---

# 17. Responsive Behaviour

The application must be usable on desktop and mobile.

Desktop should prioritise timetable grids and planning.

Mobile should prioritise the Today view.

A desktop timetable layout should not simply be squeezed onto a small screen.

Mobile views may use stacked cards or vertically scrolling day layouts.

---

# 18. Lesson Plans

Each individual class occurrence can have its own lesson plan.

Lesson-plan fields are:

## Title

Short title describing the lesson.

Recommended limit:

100 characters.

## Short Summary

Brief description visible directly on timetable cards.

Maximum:

160 characters.

## Full Lesson Plan

Long-form lesson notes with Markdown formatting.

There should not be a restrictive practical character limit.

---

# 19. Markdown Lesson Formatting

The full lesson plan should store Markdown source text.

Supported formatting should include:

* bold
* italic
* headings
* bullet lists
* numbered lists
* links
* blockquotes
* inline code
* code blocks
* horizontal rules

Example source:

```markdown
**Learning intention**

Students will understand primary and foreign keys.

### Starter

Review yesterday's database example.

### Main Activity

1. Open the example database.
2. Identify the tables.
3. Identify each relationship.

**Extension:** Design a small relational database.
```

When displayed, the Markdown should render as formatted content.

The lesson editor should ideally provide:

`Edit | Preview`

The application must safely render Markdown so that arbitrary scripts or unsafe HTML cannot execute.

---

# 20. Lesson Editing

Opening a class occurrence should display its lesson details.

On desktop, this should preferably open in a side panel.

On mobile, it may open as a full-screen panel or sheet.

Example:

```text
10DGT
Monday 10 August
Period 3
Room DT1

Introduction to Databases

Students investigate relational databases...

[Full Markdown Lesson Plan]

Edit
Carry Forward
More
```

Lesson editing should initially use an explicit Save button.

Autosaving is deferred.

---

# 21. Lesson Status

Each lesson can have a status.

Version 1 statuses are:

* Planned
* Completed
* Partially Completed
* Cancelled

Status should be distinct from cancellation reason.

---

# 22. Cancellation Reasons

If a lesson is cancelled, a reason can be recorded.

Supported reasons should include:

* Teacher away
* Students away
* School event
* Exam
* Public holiday
* Class cancelled
* Other

Cancelled lessons must remain visible in the timetable and history.

They should appear visually faded or otherwise clearly cancelled.

Cancellation must not delete lesson plans.

---

# 23. Carry Forward

Teachers can carry a lesson forward.

Carry Forward copies the lesson-plan content into the next scheduled occurrence of the same class.

The original lesson remains unchanged.

Example:

```text
Monday
Introduction to Databases
Partially Completed

Carry Forward

Wednesday
Introduction to Databases
Planned
```

The copied lesson can then be edited independently.

Version 1 does not need advanced carry-forward behaviour such as copying only unfinished sections.

---

# 24. Historical Lesson Records

Each class should have a chronological lesson history.

Example:

```text
10DGT

10 August
Introduction to Databases
Completed

12 August
Relational Databases
Completed

14 August
Primary and Foreign Keys
Partially Completed

18 August
SQL Introduction
Planned
```

Previous lessons must remain editable.

Historical lesson records should not disappear when a class is archived.

---

# 25. One-Off Lesson Changes

Teachers can change one specific lesson occurrence without changing the recurring timetable.

Example:

```text
Tuesday 18 August
10DGT

Move from Period 2 to Period 4
```

This affects only that date.

It does not modify future Week A or Week B timetable entries.

---

# 26. Room Overrides

Classes can have a default room.

Individual lesson occurrences should be capable of overriding that room later.

Example:

```text
10DGT default room: DT1

Tuesday 18 August:
Room Hall
```

The default class room remains unchanged.

---

# 27. Teacher Absence

The application should provide an "I'm Away" function.

Teachers can select:

* Today
* Date range

Affected lesson occurrences should automatically be marked as cancelled with the reason:

`Teacher away`

Existing lesson plans must remain intact.

These plans can later be carried forward.

---

# 28. Class or Student Absence

Teachers should be able to mark one or more classes as unavailable.

Example:

```text
Date: 14 August

Affected classes:
10DGT
9MAT

Reason:
School trip
```

Only the selected classes are affected.

Other timetable entries remain normal.

---

# 29. Calendar Exceptions

The calendar should support general non-teaching events such as:

* public holidays
* school closed
* teacher-only day
* exam day
* school event
* other

These calendar exceptions may disable affected lessons automatically.

Special timetable substitutions such as "Wednesday runs Friday's timetable" are explicitly deferred from Version 1.

---

# 30. Non-Class Timetable Items

The timetable should support items that are not classes.

Possible categories include:

* Duty
* Meeting
* Assembly
* Tutor/Form
* Club
* Appointment
* Other

These items may be recurring.

Example:

```text
Lunch
Duty
Courtyard
```

They should use a timetable-card system similar to classes but remain distinguishable from teaching classes.

---

# 31. One-Off Events

The application should support one-off timetable events.

Version 1 should primarily focus on events associated with timetable blocks or periods.

Support for completely arbitrary clock-time calendar events can be added later.

---

# 32. Free Periods

A free period does not need its own database record.

If an active teaching period has no class or event assigned, it should display as:

`FREE`

Adding tasks or to-do lists to free periods is deferred.

---

# 33. Calendar Area

The Calendar section should allow viewing and managing:

* terms
* teaching weeks
* Week A/B assignments
* holidays
* teacher absence
* class absence
* school closures
* special events
* one-off timetable changes

The calendar acts as the layer connecting the recurring timetable to real dates.

---

# 34. Setup Area

Setup should contain configuration for:

* academic year
* terms
* teaching weeks
* Week A/B cycle
* daily period structure
* recurring timetable
* general timetable behaviour

Recurring timetable editing should be clearly separated from day-to-day lesson planning.

---

# 35. Settings Area

Initial settings may contain basic personal and display settings.

Future settings may include:

* Google account connection
* school organisation
* allowed email domain
* theme preferences
* account management

Dark mode is not required for Version 1.

---

# 36. Authentication

Authentication will be introduced after the main prototype is working.

The initial application may use a simple local development user.

Future authentication should support:

`Continue with Google`

The intended long-term model is Google Workspace login for teachers.

A school deployment may later restrict registration to an approved domain.

Example:

`@schoolname.school.nz`

The application must never require or store the user's Google password.

---

# 37. Privacy

Teacher information is private by default.

One teacher must not be able to view another teacher's:

* classes
* lesson plans
* lesson notes
* events
* history

Future sharing features must be deliberately implemented rather than assumed.

---

# 38. Archiving

Important historical objects should generally be archived rather than deleted.

Classes can be archived when no longer active.

Archived classes retain:

* lesson history
* lesson plans
* historical timetable information

Permanent deletion may eventually be available as a deliberate secondary action.

---

# 39. Data Model Concept

The conceptual data structure is:

```text
USER
│
├── ACADEMIC YEAR
│   │
│   ├── TERMS
│   ├── TEACHING WEEKS
│   │   └── WEEK A / WEEK B
│   ├── DAILY PERIOD STRUCTURES
│   └── CALENDAR EXCEPTIONS
│
├── CLASSES
│
├── RECURRING TIMETABLE
│
├── LESSON OCCURRENCE OVERRIDES
│   ├── lesson title
│   ├── summary
│   ├── Markdown plan
│   ├── status
│   ├── cancellation
│   ├── movement
│   └── room override
│
├── ABSENCES
│
└── EVENTS
```

---

# 40. Timetable Calculation

The displayed timetable for a particular date should conceptually be calculated from:

```text
School Calendar
+
Week A/B Assignment
+
Recurring Timetable
+
Calendar Exceptions
+
Teacher/Class Absences
+
One-Off Lesson Changes
+
Events
=
Displayed Timetable
```

The architecture should preserve this model throughout development.

---

# 41. Version 1 Required Features

The first genuinely usable release should contain:

* single-user application structure
* academic-year setup
* term configuration
* Week A / Week B teaching weeks
* configurable daily period structures
* create/edit/archive classes
* recurring two-week timetable editor
* Today view
* Week view
* Fortnight view
* lesson title
* 160-character lesson summary
* Markdown lesson plan
* Markdown preview
* lesson statuses
* cancellation reasons
* carry forward
* lesson history
* teacher absence
* class absence
* recurring duties/events
* one-off lesson movement
* responsive desktop/mobile interface
* PostgreSQL persistence
* eventual login/account system
* Railway deployment

---

# 42. Explicitly Deferred Features

The following should not be implemented during initial development unless the specification is deliberately changed:

* teacher collaboration
* shared lesson plans
* student accounts
* parent accounts
* file uploads
* Google Classroom integration
* Google Calendar integration
* AI lesson generation
* complex department management
* school-wide analytics
* reporting dashboards
* notification system
* advanced task management
* free-period to-do lists
* arbitrary calendar scheduling
* special timetable substitution days
* guided school-year rollover
* lesson-plan autosave
* advanced rich-text editor
* complex Markdown extensions
* dark mode

---

# 43. Design Direction

The interface should feel like a modern productivity application rather than a traditional school management system.

Desired qualities:

* clean
* uncluttered
* fast
* readable
* responsive
* strong use of class colours
* easy access to today's lessons
* minimal unnecessary navigation

The visual inspiration is broadly:

`Google Calendar + Notion + teacher timetable`

without directly copying any product.

---

# 44. Development Principles

Development must proceed in controlled stages.

Codex should not be instructed to build the entire application in one request.

Each development stage should:

1. state what already exists
2. identify exactly what should be implemented
3. identify files or systems that may be changed
4. state what must not be changed
5. define expected behaviour
6. provide acceptance criteria
7. preserve compatibility with previous stages
8. avoid adding unrequested features
9. avoid unnecessary dependencies
10. maintain the master specification as the source of truth

---

# 45. Proposed Development Sequence

Development should broadly follow this order:

## Stage 1

Project foundation and application shell.

## Stage 2

Static navigation and responsive layout.

## Stage 3

Static timetable prototype with Day, Week and Fortnight views.

## Stage 4

Class-management interface using temporary/local sample data.

## Stage 5

Timetable setup and recurring Week A/B assignments.

## Stage 6

Lesson detail panel and lesson-plan editing.

## Stage 7

Markdown editor and preview.

## Stage 8

Lesson status, cancellation and carry-forward behaviour.

## Stage 9

Academic calendar, terms and Week A/B teaching weeks.

## Stage 10

Configurable daily period structures.

## Stage 11

Teacher absence, class absence and calendar exceptions.

## Stage 12

One-off lesson movements and timetable overrides.

## Stage 13

Class history.

## Stage 14

Recurring duties and non-class events.

## Stage 15

PostgreSQL database design and persistence.

## Stage 16

Authentication and user ownership.

## Stage 17

Google authentication preparation/integration.

## Stage 18

Responsive/mobile refinement.

## Stage 19

Validation, error handling and accessibility.

## Stage 20

Testing and application hardening.

## Stage 21

GitHub and Railway production deployment.

The exact staging may change slightly if implementation dependencies make another order more sensible, but major functionality should remain separated into manageable Codex tasks.

---

# 46. Source-of-Truth Rule

This document is the source of truth for the School Timetable Organiser project.

When implementation choices, Codex output or later development suggestions conflict with this specification, the specification takes priority unless it is deliberately updated.

New features should not be added merely because they seem useful.

Changes to scope should be explicitly agreed before becoming part of the project.

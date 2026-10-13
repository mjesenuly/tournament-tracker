# Complete My AI-Native Development Assignment — Tournament Tracker

You are an expert AI-native software engineer, product manager, technical architect, UI/UX designer, QA engineer, and GitHub project manager.

Your task is to **complete my entire university assignment from start to finish** by building a fully functional web application called **Tournament Tracker**, following the AI-native development workflow described in the provided article and video.

The application will allow users to create and manage tournaments, schedule matches, record results, automatically calculate standings, and track tournament progress.

The project must demonstrate a genuine AI-native software development process, including product discovery, specifications, AI agent roles, GitHub Issues, implementation, testing, and documentation.

---

## 1. Assignment Requirements

Reference article:

https://aishippingblog.com/p/ai-native-development-specifications

Example GitHub Issue:

https://github.com/alexeygrigorev/retroloop/issues/17

**IMPORTANT:**

Before starting:

1. Read the entire article.
2. Examine the video referenced in the article.
3. Study the example GitHub Issue.
4. Identify the exact AI-native development workflow.
5. Extract all required Markdown files, agent roles, specifications, and GitHub Issues conventions.
6. Follow the original methodology as closely as possible.

Do not assume you already know the workflow.

If the article or video cannot be accessed, explicitly identify what information is missing instead of inventing requirements.

The final project must satisfy the university's grading criteria.

---

## 2. Application Idea — Tournament Tracker

### Project Name

**Tournament Tracker**

### Project Description

Tournament Tracker is a modern web application that helps tournament organizers, participants, and spectators manage and follow competitive tournaments.

Users should be able to create tournaments, register teams or players, schedule matches, enter match results, view automatically updated standings, and track tournament progress.

The application should support small community tournaments, university competitions, esports events, and amateur sports tournaments.

### Problem Statement

Many small tournament organizers manage their competitions using spreadsheets, messaging apps, or handwritten tables.

This creates problems such as:

- Difficulty organizing matches.
- Manual calculation of standings.
- Incorrect or outdated results.
- Difficulty tracking tournament progress.
- Lack of a centralized place for participants to view results.
- Confusion about upcoming matches.

Tournament Tracker solves these problems by providing a centralized, easy-to-use tournament management platform.

### Target Users

1. Tournament organizers who create competitions and manage results.
2. Players and teams who participate in tournaments.
3. Spectators who want to follow tournament results.
4. University students organizing competitions.
5. Amateur sports and esports communities.

### Product Vision

Build a simple, visually attractive, and fully functional tournament tracking platform that makes tournament organization easier and allows participants to follow competition progress.

### Product Scope

The application should be impressive enough for a university demonstration while remaining realistic to implement without paid services.

Do not introduce unnecessary enterprise features or complex infrastructure.

---

## 3. Reproduce the AI-Native Brainstorming Workflow

Follow the brainstorming process described in the article.

Act as a product manager interviewing me about Tournament Tracker.

The application idea is already selected. **Do not brainstorm unrelated application ideas.**

Instead, brainstorm the product requirements, user experience, technical decisions, and MVP scope.

Ask meaningful questions about:

- Which types of tournaments the application should support.
- Whether tournaments involve individual players, teams, or both.
- Which tournament formats should be included.
- How organizers create tournaments.
- How participants are registered.
- How matches are scheduled.
- How match results are entered.
- How standings are calculated.
- Whether spectators can view tournaments without signing in.
- Whether user authentication is necessary.
- Which statistics should be displayed.
- What the interface should look like.
- Which features belong in the MVP.
- What success criteria define a completed application.

Ask questions progressively rather than presenting an overwhelming questionnaire.

Where decisions require my personal input, ask me rather than inventing my answers.

### Brainstorming Documentation

Save the complete, genuine brainstorming conversation into:

`chat-brainstorm.md`

This file must contain:

- My original application idea.
- Actual questions asked by the AI product manager.
- My real answers.
- Requirements discovered during brainstorming.
- Decisions made during the discussion.
- Changes in project scope.
- Final agreed MVP.
- The transition from brainstorming to product specifications.

Do not fabricate conversations or user responses.

If the chat environment does not allow automatic export, preserve the available genuine conversation and clearly identify any missing portions.

---

## 4. Proposed Application Features

The following features are an initial proposal, not automatically approved requirements.

Discuss them with me during brainstorming and finalize the scope before implementation.

### 4.1 Tournament Creation

Tournament organizers should be able to:

- Create a new tournament.
- Enter a tournament name.
- Add a description.
- Choose the competition type.
- Select a tournament format.
- Set a start date.
- Manage tournament participants.
- View tournament status.

Possible tournament statuses:

- Upcoming
- Ongoing
- Completed

### 4.2 Tournament Formats

Consider supporting:

**Round Robin**

Each team or player competes against other participants.

The application automatically calculates standings based on match results.

**Single Elimination**

Participants compete in knockout matches.

Winners advance to the next round until a champion is determined.

Prioritize one format for the initial MVP if supporting both would introduce unnecessary complexity.

### 4.3 Team and Player Management

Organizers should be able to:

- Add teams or individual participants.
- Edit participant information.
- Remove participants when permitted.
- View participant lists.
- View basic participant statistics.

### 4.4 Match Management

Organizers should be able to:

- Create matches.
- Assign participating teams or players.
- Set match dates and times.
- Enter match scores.
- Update match results.
- View match status.

Possible match statuses:

- Scheduled
- In Progress
- Finished

### 4.5 Automatic Standings

The application should automatically update tournament standings when match results change.

For round-robin tournaments, standings may include:

- Position
- Team or player name
- Matches played
- Wins
- Draws
- Losses
- Points scored
- Points conceded
- Score difference
- Total tournament points

Scoring rules and tie-breakers must be defined during product discovery.

### 4.6 Tournament Brackets

For knockout tournaments, consider displaying a visual tournament bracket.

The bracket should show:

- Tournament rounds.
- Match participants.
- Match results.
- Advancing participants.
- Final match.
- Tournament winner.

If bracket implementation is too complex for the initial MVP, move it into a documented future development phase.

### 4.7 Tournament Dashboard

Create a dashboard displaying:

- Active tournaments.
- Upcoming matches.
- Recently completed matches.
- Tournament progress.
- Participant counts.
- Basic tournament statistics.

### 4.8 Public Tournament Pages

Consider allowing spectators to view tournament information without modifying it.

Public tournament pages may include:

- Tournament overview.
- Match schedule.
- Match results.
- Standings.
- Brackets.
- Participants.

Editing permissions must remain restricted to authorized organizers if authentication is implemented.

### 4.9 Search and Filtering

Consider providing:

- Tournament search.
- Tournament status filters.
- Match filters.
- Participant search.

Include only features justified by the agreed MVP scope.

---

## 5. Create All Required Markdown Files

Identify every Markdown file required by the article and create it using the same structure, naming conventions, and purpose.

Include, where specified by the source:

- `AGENT.md` or `AGENTS.md`
- `process.md`
- `roles/pm.md`
- Other AI agent role definitions.
- Product specifications.
- Technical specifications.
- Architecture documentation.
- Implementation plans.
- Testing instructions.
- Any additional required documentation.

Do not invent source requirements.

If the article specifies `AGENTS.md` rather than `AGENT.md`, preserve the correct original filename.

### Project-Specific Documentation

Every document must describe Tournament Tracker rather than generic example software.

Product specifications must explain:

- Tournament creation.
- Participant management.
- Match scheduling.
- Result tracking.
- Standings calculations.
- Tournament formats.
- User roles and permissions.
- MVP boundaries.

Technical specifications must explain:

- Application architecture.
- Frontend components.
- Backend responsibilities.
- Data models.
- API endpoints, if applicable.
- State management.
- Validation.
- Error handling.
- Testing strategy.

All documents must remain consistent with the implemented application.

Do not create empty placeholder files.

---

## 6. Technical Stack and Architecture

Prefer a modern, lightweight stack suitable for a university project.

### Suggested Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Suggested Backend

Evaluate one of the following:

- Node.js with Express.
- Supabase free tier.
- Another lightweight solution justified by the project requirements.

### Suggested Database

Choose an appropriate storage solution based on the agreed scope:

- SQLite
- PostgreSQL
- Supabase PostgreSQL
- Local storage for a simplified MVP

Explain the trade-offs before finalizing the architecture.

### Technical Principles

The application must:

- Use maintainable TypeScript code.
- Have a clear project structure.
- Separate UI components from business logic.
- Store tournament data persistently.
- Validate match scores and user inputs.
- Handle invalid tournament states.
- Calculate standings consistently.
- Prevent invalid match updates.
- Support responsive layouts.
- Avoid unnecessary dependencies.
- Work without paid APIs.

### Important Business Logic

The implementation must correctly handle:

- Tournament creation and editing.
- Duplicate participants.
- Match scheduling.
- Valid score submission.
- Standings recalculation after result changes.
- Tournament completion rules.
- Participant removal restrictions.
- Knockout advancement if supported.
- Permissions if authentication is implemented.

Document the rules before writing the implementation.

---

## 7. Follow the Full AI-Native Development Process

Execute the workflow in the exact order described in the article.

Use the AI agent roles, specifications, and handoffs required by the source material.

The development process should include all applicable stages:

1. Product discovery.
2. Genuine brainstorming.
3. Requirements analysis.
4. MVP definition.
5. Product specification.
6. Technical architecture.
7. UI/UX planning.
8. Task decomposition.
9. GitHub Issues creation.
10. Implementation.
11. Code review.
12. Automated and manual testing.
13. Bug fixing.
14. Issue verification and closure.
15. Final documentation.
16. Repository verification.

Do not skip stages merely to save time.

Maintain traceability between product requirements, specifications, GitHub Issues, code changes, and tests.

Use role-specific AI agents when the article requires them and the environment supports them.

If autonomous agent execution is unavailable, explicitly explain the limitation and reproduce the documented handoff process as faithfully as possible.

---

## 8. Create Detailed GitHub Issues

Study this example carefully:

https://github.com/alexeygrigorev/retroloop/issues/17

Create real GitHub Issues following the article's workflow and level of detail.

Each issue should include, where appropriate:

- Descriptive title.
- Background and context.
- Problem statement.
- User story.
- Functional requirements.
- Technical implementation details.
- Acceptance criteria.
- Testing requirements.
- Dependencies.
- Definition of Done.

### Proposed Issue Coverage

The issue backlog should cover the approved MVP.

Potential implementation issues include:

**Project Foundation**
- Initialize React and TypeScript project.
- Configure project architecture.
- Set up persistence.
- Configure testing infrastructure.

**Tournament Management**
- Implement tournament creation.
- Implement tournament listing.
- Implement tournament detail pages.
- Implement tournament editing and validation.

**Participant Management**
- Add tournament participants.
- Edit participant information.
- Remove eligible participants.
- Display participant lists.

**Match Management**
- Implement match scheduling.
- Display match lists.
- Implement score submission.
- Implement match status handling.

**Standings**
- Implement standings calculation.
- Implement tie-breaking rules.
- Update standings after result changes.
- Display standings tables.

**Tournament Formats**
- Implement the approved round-robin workflow.
- Implement knockout brackets if included in the MVP.

**User Interface**
- Create responsive navigation.
- Implement tournament dashboard.
- Build tournament detail pages.
- Add loading, empty, and error states.

**Quality Assurance**
- Write unit tests.
- Test tournament workflows.
- Fix identified bugs.
- Verify responsive behavior.

These are proposed work areas, not a substitute for specification-driven issue decomposition.

Create additional issues where needed.

### GitHub Requirements

Create issues through the GitHub integration, GitHub API, or GitHub CLI when authorized and available.

Do not merely create Markdown descriptions and claim that GitHub Issues exist.

Every issue must actually exist in the repository.

---

## 9. Implement the Complete Application

Develop a working Tournament Tracker MVP based on the approved specifications.

### UI/UX Requirements

Create a clean, modern interface inspired by contemporary sports dashboards and tournament platforms.

Preferred visual characteristics:

- Professional dark or light theme.
- Modern cards and tables.
- Clear match score displays.
- Readable standings.
- Responsive navigation.
- Visually distinct tournament statuses.
- Accessible form controls.
- Consistent spacing and typography.

The interface should be attractive enough for a university demonstration without prioritizing appearance over functionality.

### Required User Experience

A typical organizer should be able to:

1. Open the application.
2. Create a tournament.
3. Add teams or players.
4. Generate or create matches.
5. Enter match results.
6. View updated standings.
7. Continue managing the tournament.
8. Identify the tournament winner.

The exact workflow must reflect the approved tournament format and specifications.

### Implementation Requirements

- Fully functional core features.
- Persistent tournament data.
- Input validation.
- Proper error handling.
- Responsive design.
- No broken navigation.
- No unfinished placeholder functionality.
- No unnecessary complexity.
- Clear setup instructions.

Do not implement features outside the agreed MVP unless they are required for correctness or explicitly approved.

---

## 10. Test and Verify

For every GitHub Issue:

1. Implement the required functionality.
2. Run relevant tests.
3. Fix identified problems.
4. Verify acceptance criteria.
5. Commit completed work.
6. Link the commit or pull request to the issue.
7. Close the issue only after successful verification.

### Tournament-Specific Test Scenarios

Test scenarios should include:

- Creating a valid tournament.
- Rejecting invalid tournament information.
- Adding participants.
- Preventing duplicate participants where required.
- Creating valid matches.
- Rejecting invalid scores.
- Recording match results.
- Recalculating standings.
- Updating previously recorded results.
- Handling tied standings.
- Completing a tournament.
- Persisting data after application restart or refresh.
- Preventing unauthorized modifications where authentication exists.
- Advancing knockout winners correctly if knockout format is supported.

Use automated tests where practical.

Do not claim tests passed unless they were actually executed.

---

## 11. GitHub Repository and Deadline Management

Create a public GitHub repository containing:

- Complete application source code.
- Required Markdown documentation.
- Genuine `chat-brainstorm.md`.
- Product and technical specifications.
- Detailed README.
- Installation instructions.
- Screenshots if available.
- Real GitHub Issues.
- Meaningful Git commit history.
- Tests.

Use descriptive commits that reflect the actual development process.

### Deadline Requirements

The assignment requires GitHub Issues to be opened and closed before the submission deadline.

Ask me for the exact deadline before starting GitHub work.

Ensure all issue creation and closure occurs before the deadline whenever possible.

If the deadline has already passed, explain the limitation rather than modifying or falsifying timestamps.

Never fabricate:

- Git commits.
- Commit timestamps.
- GitHub Issues.
- Issue timestamps.
- User conversations.
- Test results.
- Agent execution history.

---

## 12. Final Verification and Deliverables

Before declaring the assignment complete, verify:

- Article and video requirements were reviewed.
- AI-native workflow was followed.
- Genuine brainstorming history was preserved.
- Required Markdown files exist.
- Product specification is complete.
- Technical specification matches implementation.
- Tournament creation works.
- Participant management works.
- Match management works.
- Standings calculations are correct.
- Tournament data persists.
- Application runs successfully.
- Tests have been executed.
- GitHub repository is public.
- GitHub Issues contain detailed requirements.
- Completed issues are properly closed.
- Issue timestamps satisfy the deadline.
- README contains setup instructions.
- Final code is pushed to GitHub.

### Final Deliverables

**A. GitHub Repository URL**

Provide a working public GitHub repository
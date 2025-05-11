# Dungeon Master’s Notebook

Dungeon Master’s Notebook is a full-stack web application for tabletop RPG campaign management, built with a Flask (Python) backend and a React (JavaScript) frontend. It provides Dungeon Masters with a convenient digital notebook to organize their games, including managing multiple campaigns, tracking players and their characters, and logging game session notes. The app features secure user authentication, smart player/character creation flows, and client-side form validation.

## Features
- **User Authentication & Session Management**  
  Secure signup, login, and logout using Flask sessions. Session state persists across page reloads via the `SessionContext` in React.

- **Manage Multiple Games (Campaigns)**  
  Create, view, update, and delete games. Each Game has fields like title, system, status, description, start date, and setting.

- **Player Tracking & Smart Creation**  
  Add players to a game. When creating a new player, you’re immediately prompted to add their first character.

- **Character Management**  
  For each player, create, edit, and delete characters with details such as name, class, level, icon, and active status. Supports multiple characters per player.

- **Session Logs**  
  Record gameplay sessions with a date and summary. View, edit, and delete session entries.

- **Full CRUD Operations**  
  All entities—Games, Players, Characters, Sessions—support Create, Read, Update, Delete via React forms and Flask API endpoints.

- **Responsive SPA Frontend**  
  Built with React and React Router, providing smooth client-side routing and dynamic updates.

- **Persistent Storage**  
  Uses SQLAlchemy with SQLite in development and PostgreSQL in production. Models defined in `server/models.py`.

- **Form Validation**  
  All forms leverage Formik and Yup schemas for structured client-side validation.

- **API Helper & Custom Hooks**  
  - `CallApi.js` wraps `fetch` with JSON parsing, credentials, and error handling.  
  - `useCRUDForm` hook standardizes Formik-based forms.  
  - `useSessionOptions` hook generates dropdown options for navigation.

## Tech Stack
- **Backend**: Flask, Flask-RESTful, Flask-SQLAlchemy, Flask-Migrate, Flask-CORS, Flask-Bcrypt, Marshmallow  
- **Frontend**: React, React Router, Formik, Yup, Context API, React Testing Library  
- **Database**: SQLite (dev), PostgreSQL (prod)  
- **Deployment**: Render (separate services or integrated build)  
- **Utilities**: Faker for seeding, Alembic for migrations, Gunicorn for production server

## Installation & Setup (Running Locally)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/dungeon-masters-notebook.git
cd dungeon-masters-notebook
```

### 2. Backend Setup
```bash
cd server
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env       # if provided
# or set:
# SECRET_KEY, DATABASE_URI (e.g. sqlite:///app.db)

# Apply migrations or create DB
flask db upgrade           # if using Flask-Migrate
# or let the app auto-create tables on first run

# Start the Flask server
flask run                  # defaults to http://127.0.0.1:5555
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm start                  # opens http://localhost:3000
```

## Deployment to Render
- **Server**: Deploy the `server` directory as a Web Service. Build: install Python deps, run migrations or auto-create, start via `gunicorn app:app`.  
- **Client**: Deploy the `client` directory as a Static Site. Build command: `npm install && npm run build`. Publish `build` folder.  
- **Integrated Option**: Build React in `client`, serve via Flask’s `static_folder` and `template_folder`, and deploy `server` only with both build and dependencies steps.

## Database Schema and Relationships
- A **User** owns multiple **Games**  
- A **Game** has many **Sessions** and **Characters**  
- A **Player** has many **Characters** (and is linked to Games via Characters)  
- A **Character** belongs to one **Game** and one **Player**  
- A **Session** belongs to one **Game**

Diagram:
```erDiagram
User ||--o{ Game : owns
Game ||--o{ Session : includes
Game ||--o{ Character : includes
Player ||--o{ Character : controls
```

## Project Structure

```
.
├── client/
│   ├── package.json
│   ├── package-lock.json
│   ├── public/                 # static assets (favicon, index.html, manifest, logos)
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── assets/             # background & logo images
│   │   ├── components/         # UI components (cards, forms, navbar, etc.)
│   │   ├── contexts/           # SessionContext
│   │   ├── hooks/              # useCRUDForm, useSessionOptions
│   │   ├── pages/              # Dashboard, GamePage, PlayerPage, etc.
│   │   ├── routes/             # routes.js (AppRoutes)
│   │   ├── utils/              # CallApi.js
│   │   ├── styles/             # CSS files
│   │   └── tests/              # tests (App.test.js, setupTests.js)
├── server/
│   ├── app.py                  # Flask app entry, API resources
│   ├── config.py               # configuration, CORS, DB setup
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Marshmallow schemas
│   ├── seed.py                 # data seeding script
│   ├── migrations/             # Alembic migration files
│   ├── requirements.txt        # Python dependencies
│   └── Pipfile / Pipfile.lock  # (optional) Pipenv config
└── README.md                   # Project documentation
```

## Detailed File Overview

### Views (Page-Level Components)
- **AuthPage.js**  
  Manages the authentication flow by toggling between login and signup forms. It uses React state and the `SessionContext` to redirect authenticated users to the dashboard, ensuring a seamless entry point to the app.

- **Dashboard.js**  
  Serves as the main landing page for logged-in users. It lists existing games via `GameCard` components and provides `NewGame` and `NewPlayer` forms. This page orchestrates high-level CRUD flows and updates session context on changes.

- **GamePage.js**  
  Presents detailed information for a single game: its title, description, player roster (via `PlayerCard`), and session log. It also offers inline editing of game metadata and a `NewSession` form, tying all game-specific features together.

- **PlayerPage.js**  
  Displays and manages an individual player’s profile, including their summary and character list. Supports editing and deletion of the player, and leverages shared components (`CharacterCard`, `FormField`) to maintain UI consistency.

- **CharacterPage.js**  
  Focuses on a single character’s detailed view, allowing in-place editing or deletion. It locates the character across nested games and players in `SessionContext` and ensures state is updated globally on changes.

- **SessionPage.js**  
  Shows the notes and date for a specific game session. It enables editing of session details and deletion, coordinating with `SessionContext` to reflect changes across the app.

- **AllCharactersPage.js**  
  Wraps the `AllCharacters` component to provide a full-page view listing every character across all games, with powerful filtering via dropdowns.

### Components (Reusable UI Elements)
- **NavBar.js**  
  Renders site-wide navigation links and dropdowns (`NavSelect`) based on session data. It handles logout logic and dynamically adjusts links for authenticated vs. guest users.

- **NavSelect.js**  
  A reusable dropdown component that navigates to different routes on selection. It decouples navigation logic from layout, promoting consistency across pages.

- **FilterableList.js**  
  Provides a generic container for dropdown filters and renders filtered item lists. Used by `AllCharacters` for multi-criteria filtering with minimal boilerplate.

- **FormField.js**  
  Wraps Formik’s `<Field>` with labels and error messages, supporting multiple input types (text, checkbox, select). Standardizes form markup and validation feedback.

- **GameCard.js**  
  Displays a concise summary of a game, including title, description, and its players. Serves as the building block on the Dashboard.

- **PlayerCard.js**  
  Shows a player’s name, summary, and their characters. Includes a toggleable `NewCharacter` form, encapsulating the pattern of inline creation.

- **CharacterCard.js**  
  Renders a character’s basic info and icon, with edit/delete controls. It links to the character detail page for deeper management.

- **NewGame.js**, **NewPlayer.js**, **NewCharacter.js**, **NewSession.js**  
  Each uses Formik + Yup (via `useCRUDForm` or inline) to submit to REST endpoints. They encapsulate create flows for games, players (with initial character), characters, and sessions, respectively.

- **AllCharacters.js**  
  Aggregates characters from all games in session state, deduplicates, and renders a filterable list. Demonstrates imperative data gathering alongside declarative rendering.

- **ProtectedRoute.js**  
  Wraps React Router routes to guard access based on authentication state, redirecting unauthenticated users to the auth page.

### Hooks & Context
- **SessionContext.js**  
  Provides global state for the logged-in user and their related data. Initializes session on app load by calling `/check_session` and prevents UI from rendering until the check completes.

- **useCRUDForm.js**  
  A custom hook / component that wraps Formik form creation, handling POST requests, JSON parsing, error handling, and reset logic, reducing repetitive form code.

- **UseSessionOptions.js**  
  Builds dropdown option arrays (`value`/`label`) for games, players, and characters from session data. Centralizes list derivation for navigation and filtering.

### Routing
- **routes.js**  
  Defines all React Router routes, mapping paths to pages and guarding protected routes with `ProtectedRoute`. It ensures a clean URL structure and single-source configuration.

### Utilities
- **CallApi.js**  
  Abstracts `fetch` calls with JSON parsing, credentials, and centralized error handling. Reduces boilerplate for every REST API call in the client.
  

- **App.js**  
  The root React component that sets up `Router`, `NavBar`, and `AppRoutes`, bootstrapping the entire frontend.

- **index.js**  
  Renders the React app into the DOM, wrapping it with `SessionProvider` for global context access.

### Server-Side
- **app.py**  
  Defines Flask routes and RESTful resources using Flask-RESTful. Includes session checks, signup/login/logout, and CRUD endpoints for games, players, characters, and sessions.

- **config.py**  
  Configures the Flask app, database (SQLAlchemy), CORS, migrations, and environment loading. Sets up naming conventions, marshmallow, and error handling.

- **models.py**  
  Declares SQLAlchemy ORM models for User, Game, Player, Character, and Session. Uses relationships, association proxies, and hybrid properties for password hashing.

- **schemas.py**  
  Implements Marshmallow schemas for serializing/deserializing models, handling nested relationships, unique player derivation, and input validation.

- **seed.py**  
  Seeds the database with fake data using Faker, creating users, games, players, sessions, and characters to bootstrap development and testing.




## Testing
- **Frontend tests**: Located in `client/src/tests` (e.g. `App.test.js`), run with `npm test`.  
- **Backend tests**: Not yet implemented.

## Future Improvements and Enhancements
- Enhance character sheets with stats, inventory, and rich text backstories.  
- Add calendar integration and session reminders.  
- Introduce player-specific portals/roles.  
- Implement search, filtering, and pagination for large campaigns.  
- Integrate rich text editor for session notes and file uploads.  
- Expand schema with NPCs, locations, quests, and more world-building tools.  
- CI/CD pipeline for automated testing and deployments.

---

Thank you for using Dungeon Master’s Notebook! Happy gaming and coding!
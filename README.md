# Angular Card Game - "La Bataille" Implementation

A card game implementation of "La Bataille" (French) built with Angular 18, showcasing advanced usage of Angular Signals for reactive state management. 

## Features

- Classic "La Bataille" card game implementation for two players
- List of last played games loaded from REST API
- Responsive design with Ionic components
- Support for Dark/Light theme modes
- Possibility to play a new game
  - Game progression through button clicks
  - Game history and scores tracking
  - Game state management using Angular Signals
  - Save game results to REST API

## Technical Stack

- Angular 18
- Ionic Framework
- TypeScript 5.4
- RxJS
- Angular Signals
- Jasmine/Karma for testing

## Game Rules

- Deck consists of 52 cards (simplified values from 1 to 52)
- Cards are shuffled and dealt to 2 players
- Players reveal their top card by clicking a button
- Player with the highest card value wins a point
- Game continues until all cards are played
- Winner is declared based on final score

## Project Structure

The project follows a feature-based architecture:

- `src/app/`:
  - `core/`:
    - `abstract/`: Abstract classes (DataLoader)
  - `features/`:
    - `activegame/`:
      - `classes/`: ActivePlayer class, representing a player in the game
      - `guards/`: Navigation guards
      - `models/`: Game state and types
      - `ui/`:
        - `game-board/`: Main game board component
        - `player-deck/`: Player card display
        - `player-selector/`: Player selection component
    - `games/`:
      - `models/`: Game and score interfaces
      - `services/`: Game management service
      - `ui/`:
        - `scoreboard/`: Game results display
    - `players/`:
      - `models/`: Player interface
      - `services/`: Player management service
  - `pages/`:
    - `home/`: Game history display (and home page)
    - `activegame/`: Active game page

- `environments/`: Environment configuration files
- `assets/`: Static assets
- `theme/`: Global styling variables

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Ionic CLI: `npm install -g @ionic/cli`

### API Server Setup
1. Clone and setup the test API server:   ```bash
   git clone https://github.com/sogexia/hiring-frontend-api-server
   cd hiring-frontend-api-server
   npm install
   npm start   ```

### Application Setup
1. Install dependencies:   ```bash
   npm install   ```

2. Configure the API connection:

   The API connection can be configured in two places:

   - `src/environments/environment.ts` for the API key and the API path

   - `proxy.conf.json` for API base URL and port of the API server

3. Start the development server:   ```bash
   ionic serve   ```

### Important Notes
- Make sure the API server is running before starting the application
- The API server must be accessible at the URL specified in the proxy configuration
- The API key in `environment.ts` must match the one expected by the API server

## Documentation

The documentation is not complete yet.

The project uses TypeDoc and JSDoc for documentation generation. 

Key documented areas that well documented:

- `ActivePlayer` class: Core game logic implementation
- `GameBoard` component: Game progression UI
- `ActiveGamePage` page: Active game page

Generate documentation using: `npm run docs`

## Testing

The project includes some unit tests for core services. Run tests with: `ng test`

Currently implemented tests cover:
- Data loading services
- Player management
- Game state management

Note: End-to-end tests are not implemented yet. Unit tests are far from being exhaustive and could be completed with more time.

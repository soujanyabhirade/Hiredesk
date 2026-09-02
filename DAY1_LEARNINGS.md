# Day 1 Learnings — HireDesk

## 1. Project Setup

Today I set up the HireDesk development environment.

### Tools and technologies

- Node.js
- npm
- NestJS
- TypeScript
- PostgreSQL
- Git
- GitHub
- VS Code

---

## 2. Node.js

Node.js is a runtime environment that allows JavaScript to run outside the browser.

In a backend application, Node.js runs the server-side code.

---

## 3. NestJS

NestJS is a backend framework built on Node.js.

It helps organize a backend application using modules, controllers, and services.

The basic structure is:

```text
NestJS Application
       |
       └── Module
            |
            ├── Controller
            |
            └── Service
## Engineering Conventions

### Backend Technology
- Framework: NestJS 11
- Language: TypeScript
- Runtime: Node.js

### Development Commands
- `npm run start:dev` - development mode with watch
- `npm run build` - build the application
- `npm start` - start the application
- `npm test` - run Jest tests
- `npm run test:watch` - run tests in watch mode
- `npm run test:cov` - run tests with coverage

### Testing
- Testing framework: Jest
- TypeScript testing support: ts-jest

### Dependency Management
- Runtime packages are kept in `dependencies`.
- Development/build/test tools are kept in `devDependencies`.

### Code Quality
- TypeScript is used throughout the backend.
- ESLint and Prettier conventions should be checked from their configuration files.
### Formatting
- Prettier is used for code formatting.
- Strings use single quotes.
- Trailing commas are used where supported.
### Linting
- No ESLint configuration file is currently present in the backend.
- No project-specific ESLint rules were identified.

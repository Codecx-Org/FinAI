# BizSawa Mobile Client

This is the Expo Router + React Native mobile application for **BizSawa**.

## Environment Setup

Copy `.env.example` to `.env` inside this folder and configure:
```ini
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Running the Application

Ensure the Fastify backend is running locally. Then execute:
```bash
# Install dependencies
npm install

# Run integration tests
npm run test

# Start the Expo development server
npm run start
```

## Architecture and Key API Hooks

- `useAuth`: Handles JWT authentication status, AsyncStorage storage, and user profile metadata.
- `useSales`: Queries sales ledger records and records new sales transactions.
- `useOrders`: Submits orders, tracks processing status, and manages updates.
- `useCustomers`: Lists and adds customer information.
- `useBusiness` & `useUpdateBusiness`: Synchronizes company configurations and goals metadata.
- `useAchievements`: Loads business milestones and tracks gamification progress.
- `useAnalytics`: Fetches weekly revenue summaries, expense analytics, and AI insights.

# Supabase Database Connection Best Practices

## Environment Variables
- **NEVER** commit API keys, secrets, or connection strings to version control
- Store all Supabase credentials in `.env` or `.env.local` files
- Use environment variables for:
  - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, never expose to client)

## Client Initialization
- Initialize Supabase client once and reuse it across the app
- Create a singleton instance or use React Context for client sharing
- Use the `@supabase/supabase-js` package for React Native/Expo
- Always use the anonymous key for client-side operations
- Never use service role key in client-side code

## Connection Pattern
```javascript
// Recommended: Create a supabase client module
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Security Best Practices
1. **Row Level Security (RLS)**: Always enable RLS on all tables
2. **Policies**: Create granular policies for SELECT, INSERT, UPDATE, DELETE operations
3. **Service Role Key**: Only use on server-side or in secure backend functions
4. **API Keys**: Use anonymous key for client, service role key only for admin operations
5. **Connection Pooling**: Use connection pooling for server-side operations
6. **Rate Limiting**: Implement rate limiting on sensitive operations

## Error Handling
- Always handle errors from Supabase operations
- Check for network errors and provide user-friendly messages
- Log errors appropriately (never log sensitive data)
- Implement retry logic for transient failures

## Query Best Practices
1. **Select Specific Columns**: Only select columns you need (`select('id, name')` not `select('*')`)
2. **Use Filters Efficiently**: Apply filters at the database level, not in JavaScript
3. **Pagination**: Always implement pagination for large datasets using `range()`
4. **Indexes**: Ensure proper database indexes on frequently queried columns
5. **Avoid N+1 Queries**: Use joins or batch queries when possible

## Authentication
- Use Supabase Auth for user authentication
- Store session tokens securely using AsyncStorage
- Implement proper session refresh logic
- Handle token expiration gracefully
- Never store passwords in plain text

## Real-time Subscriptions
- Clean up subscriptions when components unmount
- Use proper channel names and avoid conflicts
- Implement reconnection logic for dropped connections
- Be mindful of subscription limits

## Database Schema
- Use meaningful table and column names
- Add proper constraints (NOT NULL, UNIQUE, FOREIGN KEY)
- Use appropriate data types
- Add indexes on foreign keys and frequently queried columns
- Document your schema with comments

## Migration Strategy
- Use Supabase migrations for schema changes
- Test migrations in development first
- Never run destructive migrations without backups
- Version control all migration files

## Performance
- Use connection pooling for server-side operations
- Implement caching where appropriate
- Monitor query performance
- Use database functions for complex operations
- Optimize images and files stored in Supabase Storage

## Code Organization
- Create separate service/module files for database operations
- Use TypeScript types generated from Supabase schema
- Implement repository pattern for complex data access
- Keep business logic separate from data access

## Testing
- Use Supabase local development for testing
- Mock Supabase client in unit tests
- Test RLS policies thoroughly
- Test error scenarios and edge cases

# Atomic Design Principles for Habit Tracker

## Overview
This project follows Atomic Design methodology to create reusable, maintainable, and scalable components.

## Component Hierarchy

### 1. Atoms (Smallest Components)
**Location:** `components/atoms/`

**Purpose:** Basic building blocks that cannot be broken down further.

**Examples:**
- Buttons (PrimaryButton, SecondaryButton, IconButton)
- Input fields (TextInput, NumberInput)
- Labels (Label, Heading)
- Icons
- Badges
- Dividers

**Rules:**
- Should be completely self-contained
- No business logic, only presentation
- Accept props for customization (colors, sizes, text)
- Should be highly reusable across the app
- Single responsibility principle

**Example Structure:**
```javascript
// components/atoms/Button.js
export const Button = ({ title, onPress, variant, ...props }) => {
  // Pure presentation component
};
```

### 2. Molecules (Simple Combinations)
**Location:** `components/molecules/`

**Purpose:** Simple combinations of atoms that form a functional unit.

**Examples:**
- FormField (Label + TextInput + ErrorMessage)
- HabitCard (Title + Description + Streak + Actions)
- SearchBar (Input + Icon)
- ListItem (Icon + Text + Action)

**Rules:**
- Combine 2-3 atoms
- Can have minimal state (like form inputs)
- Should handle simple interactions
- Still reusable but more specific than atoms

**Example Structure:**
```javascript
// components/molecules/HabitCard.js
import { Text } from '../atoms/Text';
import { Button } from '../atoms/Button';
export const HabitCard = ({ habit, onEdit, onDelete }) => {
  // Combines multiple atoms
};
```

### 3. Organisms (Complex Components)
**Location:** `components/organisms/`

**Purpose:** Complex UI sections combining molecules and atoms.

**Examples:**
- HabitList (Multiple HabitCards + Header + Actions)
- HabitForm (Multiple FormFields + Validation + Submit)
- NavigationHeader
- FilterSection

**Rules:**
- Can have significant state management
- Handle business logic for their section
- Combine multiple molecules and atoms
- More specific to the app's domain

**Example Structure:**
```javascript
// components/organisms/HabitList.js
import { HabitCard } from '../molecules/HabitCard';
import { Button } from '../atoms/Button';
export const HabitList = ({ habits, onEdit, onDelete }) => {
  // Complex component with state and logic
};
```

### 4. Templates (Page Layouts)
**Location:** `components/templates/`

**Purpose:** Page-level layouts that define structure.

**Examples:**
- HabitTrackerLayout
- SettingsLayout
- DashboardLayout

**Rules:**
- Define page structure and layout
- Placeholder for organisms
- No real content, just structure
- Define grid/flow of components

### 5. Pages (Complete Views)
**Location:** `components/pages/` or root level

**Purpose:** Complete pages with real content.

**Examples:**
- HabitTrackerPage
- SettingsPage

**Rules:**
- Combine templates with real data
- Handle data fetching
- Connect to services/APIs
- Route-level components

## File Naming Conventions

- **Atoms:** `Button.js`, `Input.js`, `Label.js` (singular, PascalCase)
- **Molecules:** `HabitCard.js`, `FormField.js` (singular, PascalCase)
- **Organisms:** `HabitList.js`, `HabitForm.js` (singular, PascalCase)
- **Templates:** `HabitTrackerLayout.js` (descriptive, PascalCase)
- **Pages:** `HabitTrackerPage.js` (descriptive, PascalCase)

## Component Structure Template

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * [ComponentName] - [Brief description]
 * 
 * @param {Object} props - Component props
 * @param {string} props.example - Example prop description
 * @returns {JSX.Element} Component JSX
 */
export const ComponentName = ({ example, ...props }) => {
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles
  },
});
```

## Import/Export Rules

1. **Use named exports** for all components
2. **Create index.js files** in each folder for cleaner imports
3. **Example:**
   ```javascript
   // components/atoms/index.js
   export { Button } from './Button';
   export { Input } from './Input';
   
   // Usage
   import { Button, Input } from '../components/atoms';
   ```

## Props and Styling

1. **Props:**
   - Use TypeScript or PropTypes for type checking
   - Document all props with JSDoc
   - Use default props for optional values
   - Destructure props at the top

2. **Styling:**
   - Keep styles at the bottom of the file
   - Use StyleSheet.create for performance
   - Accept style prop for customization
   - Use theme constants for colors/sizes

3. **State:**
   - Atoms: No state (or minimal UI state like hover)
   - Molecules: Minimal state (form inputs)
   - Organisms: Can have significant state
   - Pages: Handle data fetching and global state

## Reusability Guidelines

1. **DRY Principle:** Don't repeat yourself
2. **Single Responsibility:** Each component does one thing well
3. **Composition over Inheritance:** Build complex from simple
4. **Props for Customization:** Make components flexible via props
5. **Default Values:** Provide sensible defaults

## Testing Considerations

- Atoms: Test rendering and props
- Molecules: Test interactions and combinations
- Organisms: Test business logic and state
- Pages: Test data flow and integration

## Example Component Hierarchy

```
components/
├── atoms/
│   ├── Button/
│   │   ├── Button.js
│   │   ├── Button.test.js
│   │   └── index.js
│   ├── Input/
│   └── Text/
├── molecules/
│   ├── HabitCard/
│   ├── FormField/
│   └── ListItem/
├── organisms/
│   ├── HabitList/
│   ├── HabitForm/
│   └── ViewAllHabits/
├── templates/
│   └── HabitTrackerLayout/
└── pages/
    └── HabitTrackerPage/
```

## Best Practices

1. **Start Small:** Build atoms first, then compose upward
2. **Think Reusable:** Ask "Can this be used elsewhere?"
3. **Keep It Simple:** Don't over-engineer simple components
4. **Document:** Comment complex logic and props
5. **Consistent Naming:** Follow established patterns
6. **Folder Structure:** Group related components
7. **Shared Styles:** Use theme/constants for common values

# Components Structure

This folder follows **Atomic Design** principles for building reusable, maintainable components.

## Folder Structure

```
components/
├── atoms/          # Basic building blocks (buttons, inputs, labels)
├── molecules/       # Simple combinations of atoms (form fields, cards)
├── organisms/      # Complex UI sections (forms, lists, headers)
└── HabitTracker.js # Page-level component (uses organisms/molecules/atoms)
```

## Component Hierarchy

### Atoms (`atoms/`)
Smallest, most basic components that cannot be broken down further.
- No business logic
- Highly reusable
- Pure presentation

### Molecules (`molecules/`)
Simple combinations of 2-3 atoms that form a functional unit.
- Minimal state
- Simple interactions
- More specific than atoms

**Current Components:**
- `ViewAllButton` - Reusable "View All" button with variants

### Organisms (`organisms/`)
Complex UI sections combining molecules and atoms.
- Can have significant state
- Handle business logic
- More domain-specific

### Pages
Complete page components that combine organisms, molecules, and atoms.
- Handle data fetching
- Connect to services/APIs
- Route-level components

## Usage

### Importing Components

```javascript
// Import from molecules
import { ViewAllButton } from './molecules';

// Or use the index file
import { ViewAllButton } from './molecules';
```

### Creating New Components

1. **Determine the level:**
   - Is it a basic UI element? → `atoms/`
   - Is it a combination of 2-3 atoms? → `molecules/`
   - Is it a complex section? → `organisms/`

2. **Follow naming conventions:**
   - PascalCase for component files
   - Named exports
   - Export from index.js

3. **Document your component:**
   - Add JSDoc comments
   - Document all props
   - Include usage examples

## Best Practices

- ✅ Use named exports
- ✅ Keep components focused and single-purpose
- ✅ Accept style props for customization
- ✅ Document all props with JSDoc
- ✅ Follow the atomic design hierarchy
- ✅ Reuse existing components when possible

## See Also

- `.cursor/atomic-design-rules.md` - Detailed atomic design guidelines

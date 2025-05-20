# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Testing

This project includes comprehensive testing using Vitest and React Testing Library:

### Setup

- **Vitest**: Used as the test runner
- **React Testing Library**: Used for rendering and interacting with components
- **@testing-library/jest-dom**: Provides custom DOM element matchers

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Files

- **Component Tests**: Located in `src/components/__tests__/`
  - Tests for UI components like `ColorfulCharacters`

- **Page Tests**: Located in `src/pages/__tests__/`
  - Tests for pages like `HomePage` and `RoomPage`

### Test Coverage

- **Unit Tests**: Testing individual components in isolation
- **Integration Tests**: Testing component interaction with APIs
- **Mocking**: Socket.io connections and browser APIs

### What to Test in Frontend

1. **Component Rendering**: Verify components render correctly
2. **User Interactions**: Test button clicks, form submissions, etc.
3. **State Changes**: Ensure state updates correctly after user actions
4. **API Interactions**: Test API calls are made with correct parameters
5. **Error Handling**: Verify errors are displayed to the user
6. **Responsive Behavior**: Test different screen sizes if applicable
7. **Accessibility**: Test keyboard navigation and screen reader compatibility

### Example Test

```tsx
it('renders all characters', () => {
  render(<ColorfulCharacters />);
  
  // The component should render 8 characters
  const characterElements = document.querySelectorAll('[style*="background-color"]');
  expect(characterElements.length).toBe(8);
});
```

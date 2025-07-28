import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { listenToWalletData } from 'nexus-module';
import marketplaceTheme from './Styles/theme';

import configureStore from './configureStore';
import App from './App';
import './Styles/styles.css';

const store = configureStore();
listenToWalletData(store);

const {
  libraries: {
    React,
    ReactDOM,
    emotion: { react, styled, cache },
  }
} = NEXUS;
const { ThemeProvider } = NEXUS.libraries.emotion.react;

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <ThemeProvider theme={marketplaceTheme}>
      <App />
    </ThemeProvider>
  </Provider>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CustomerAuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CustomerAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

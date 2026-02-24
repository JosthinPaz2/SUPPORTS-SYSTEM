import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';

// Layout principal con contextos
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootLayout>
        <Login />
      </RootLayout>
    ),
  },
  // Routes for now: only login (root). Other routes removed until implemented.
  {
    path: '*',
    element: (
      <RootLayout>
        <Navigate to="/" replace />
      </RootLayout>
    ),
  },
]);

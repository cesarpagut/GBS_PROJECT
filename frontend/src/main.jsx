import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx'
import './index.css'

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import HojaVidaPage from './pages/HojaVidaPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/dashboard', element: (<ProtectedRoute><DashboardPage /></ProtectedRoute>) },
      { path: '/inventory', element: (<ProtectedRoute><InventoryPage /></ProtectedRoute>) },
      { path: '/inventory/:equipoId', element: (<ProtectedRoute><HojaVidaPage /></ProtectedRoute>) },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
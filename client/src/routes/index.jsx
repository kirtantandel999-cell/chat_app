import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

// Lazy load page components
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Chat = lazy(() => import("@/pages/Chat"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin motion-reduce:animate-none"></div>
    <span className="sr-only">Loading...</span>
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // Public-only routes (Login, Register)
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: withSuspense(Login) },
          { path: "/register", element: withSuspense(Register) },
        ],
      },
    ],
  },

  // Protected routes (Chat, Profile)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/chat", element: withSuspense(Chat) },
          { path: "/chat/:conversationId", element: withSuspense(Chat) },
          { path: "/profile", element: withSuspense(Profile) },
        ],
      },
    ],
  },

  // Root redirect to /chat
  {
    path: "/",
    element: <Navigate to="/chat" replace />,
  },

  // 404 Wildcard
  {
    path: "*",
    element: withSuspense(NotFound),
  },
]);

export default router;

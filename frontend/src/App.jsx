import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import RoomPage from "./pages/RoomPage/RoomPage";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import LandingPage from "./pages/LandingPage/LandingPage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { RegisterPage } from "./pages/Auth/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
function App()
{
  const router = createBrowserRouter([
    {
      path: '/',
      element: <LandingPage/>
    },
    {
      path: '/login',
      element: <LoginPage/>
    },
    {
      path: '/register',
      element: <RegisterPage/>
    },

    {
      path: '/home/:roomId',
      element: <RoomPage/>
    },
    {
      path: '*',
      element: <ErrorPage/>
    }
  ])
    
  return(
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
    
  );
}

export default App;
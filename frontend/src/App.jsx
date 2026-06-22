import { createBrowserRouter, RouterProvider } from "react-router";
import RoomPage from "./pages/RoomPage/RoomPage";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import LandingPage from "./pages/LandingPage/LandingPage";
function App()
{
  const router = createBrowserRouter([
    {
      path: '/',
      element: <LandingPage/>
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
    <RouterProvider router={router}/>
  );
}

export default App;
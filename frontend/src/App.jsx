import CreateRoom from "./components/CreateRoom";
import { createBrowserRouter, RouterProvider } from "react-router";
import HomePage from "./components/HomePage";
import ErrorPage from "./components/ErrorPage";
function App()
{
  const router = createBrowserRouter([
    {
      path: '/',
      element: <CreateRoom/>
    },
    {
      path: '/home',
      element: <HomePage/>
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
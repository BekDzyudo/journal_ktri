import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MainLayout from "./layouts/MainLayout";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import HomeJurnal from "./pages/home/HomeJurnal";
import Contact from "./pages/contact/Contact";
import NotFound from "./pages/not-found/NotFound";
import Tahririyat from "./pages/tahririyat/Tahririyat";
import Announcements from "./pages/announcements/Announcements";
import AnnouncementDetail from "./pages/announcements/AnnouncementDetail";
import Magazine from "./pages/jurnal/Magazine";

function App() {

  const {auth} = useContext(AuthContext)

  const routes = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          index: true,
          element: <HomeJurnal />,
        },
        {
          path: "leadership",
          element: <Tahririyat/>
        },
        {
          path: "announcements",
          element: <Announcements/>
        },
        {
          path: "announcements/:id",
          element: <AnnouncementDetail/>
        },
        {
          path: "magazines",
          element: <Magazine/>
        },
        {
          path: "contact",
          element: <Contact/>
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />    }
  ]);
  return (
    <>
      <RouterProvider router={routes} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;

import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomeContextProvider } from "./contexts/home/HomeContext.jsx";
import { auth } from "./firebase/config.js";
import Auth from "./routes/Auth.jsx";
import Home from "./routes/Home.jsx";
import Profile from "./routes/Profile.jsx";

export default function App() {
    const setUser = useState(null)[1];

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                localStorage.setItem("isAuthenticated", "true");
            } else {
                localStorage.setItem("isAuthenticated", "false");
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

    const router = createBrowserRouter([
        {
            path: "/",
            element: isAuthenticated ?
                <HomeContextProvider><Home /></HomeContextProvider>
                : <Auth />
        },
        {
            path: "/profile/:profileId",
            element: <HomeContextProvider><Profile /></HomeContextProvider>
        }
    ]);

    return (
        <RouterProvider router={router} />
    );
}

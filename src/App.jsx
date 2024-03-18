import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { auth } from "./config/firebase.js";
import Auth from "./routes/Auth.jsx";
import Home from "./routes/Home.jsx";
import Profile from "./routes/Profile.jsx";

export default function App() {
    const [user, setUser] = useState(null);

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
            element: isAuthenticated ? <Home /> : <Auth />
        },
        {
            path: "/profile/:profileId",
            element: <Profile />
        }
    ]);

    return (
        <RouterProvider router={router} />
    );
}

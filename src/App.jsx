import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { auth } from "./config/firebase.js";
import Auth from "./routes/Auth.jsx";
import Home from "./routes/Home.jsx";

export default function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                localStorage.setItem("isAuthenticated", "true"); // Store as string
            } else {
                localStorage.removeItem("isAuthenticated");
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
        }
    ]);

    return (
        <RouterProvider router={router} />
    );
}

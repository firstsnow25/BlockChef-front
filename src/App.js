// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Startpage from "./pages/Startpage";
import SignIn from "./pages/SignIn";
import SignUp1 from "./pages/SignUp1";
import SignUp2 from "./pages/SignUp2";
import PasswordReset1 from "./pages/PasswordReset1";
import PasswordReset2 from "./pages/PasswordReset2";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Startpage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup1" element={<SignUp1 />} />
        <Route path="/signup2" element={<SignUp2 />} />
        <Route path="/password-reset1" element={<PasswordReset1 />} />
        <Route path="/password-reset2" element={<PasswordReset2 />} />
      </Routes>
    </BrowserRouter>
  );
}

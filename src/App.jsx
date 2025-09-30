
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Recortar from "./components/Recortar";
import Pdf from "./components/Pdf.jsx";

function App() {
  return (
    <HashRouter>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Recortar />} />
          <Route path="/pdf" element={<Pdf />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
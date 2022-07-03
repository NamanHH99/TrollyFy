import React from "react";
import Footer from "./components/footer";
import Header from "./components/header";
import HomePage from "./components/HomePage";
import {BrowserRouter,Route,Routes} from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
        <Footer />
    </BrowserRouter>
  );
}
export default App;

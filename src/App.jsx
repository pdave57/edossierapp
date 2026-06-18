import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Officers from "./components/Officers";
import Dashboard from "./components/Dashboard";
import Systems from "./components/Systems";
import News from "./components/News";
import QuickLinks from "./components/QuickLinks";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<>
          <Hero />
          <Ticker />
          <Officers />
          <Dashboard />
          <Systems />
          <News />
          <QuickLinks />
          <Footer />
        </>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;

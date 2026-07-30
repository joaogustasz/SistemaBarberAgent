import React from "react";
import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100">
      <PublicHeader />
      <Outlet />
      <Footer />
    </div>
  );
}

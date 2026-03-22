
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dashboard">
      
      <main className={`content ${open ? "sidebar-open" : ""}`}>
        {children}
      </main>
    </div>
  );
}
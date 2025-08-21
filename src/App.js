
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import "./App.css";
import Homepage from "./pages/Homepage";
import Inscription from "./authentification/inscription";
import Login from "./authentification/login";
import Dashboard from "./pages/Dashboard";


import AdminLayout from "./components/admin/AdminLayout.jsx";
import AssociationLayout from "./components/association/AssociationLayout.jsx";
import CitoyenLayout from "./components/citoyen/CitoyenLayout.jsx";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
        {/* Contenu principal */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Inscription />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/welcome/admin/*" element={<AdminLayout />} />
            <Route
              path="/welcome/association/*"
              element={<AssociationLayout />}
            />
            <Route path="/welcome/citoyen/*" element={<CitoyenLayout />} />
          </Routes>
        </main>


      </div>
    </Router>
  );
}

export default App;

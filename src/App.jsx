import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChooseLogin from './pages/ChooseLogin';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Employes from './pages/Employes';
import Pointage from './pages/Pointage';
import Conge from './pages/Conge';
import Salaire from './pages/Salaire';
import Presence from './pages/Presence';
import Rapport from './pages/Rapport';
import Projets from './pages/Projets';
import Badges from './pages/Badges';
import EmployeLogin from './pages/employe/EmployeLogin';
import EmployeRegister from './pages/employe/EmployeRegister';
import EmployeDashboard from './pages/employe/EmployeDashboard';
import EmployeProfile from './pages/employe/EmployeProfile';
import EmployePointage from './pages/employe/EmployePointage';
import EmployeConge from './pages/employe/EmployeConge';
import EmployeSalaire from './pages/employe/EmployeSalaire';
import EmployeRapport from './pages/employe/EmployeRapport';
import EmployeProjets from './pages/employe/EmployeProjets';
import { isAuthenticated } from './services/api';

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function EmployeRoute({ children }) {
  const token = localStorage.getItem('employe_token');
  return token ? children : <Navigate to="/employe-login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChooseLogin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/employe-login" element={<EmployeLogin />} />
        <Route path="/employe-register" element={<EmployeRegister />} />
        
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/employes" element={<Employes />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/presence" element={<Presence />} />
          <Route path="/pointage" element={<Pointage />} />
          <Route path="/conge" element={<Conge />} />
          <Route path="/salaire" element={<Salaire />} />
          
          <Route path="/rapport" element={<Rapport />} />
          <Route path="/projets" element={<Projets />} />
        </Route>
        
        <Route element={<EmployeRoute><EmployeDashboard /></EmployeRoute>} />
        <Route path="/employe/dashboard" element={<EmployeRoute><EmployeDashboard /></EmployeRoute>} />
        <Route path="/employe/profile" element={<EmployeRoute><EmployeProfile /></EmployeRoute>} />
        <Route path="/employe/pointage" element={<EmployeRoute><EmployePointage /></EmployeRoute>} />
        <Route path="/employe/conge" element={<EmployeRoute><EmployeConge /></EmployeRoute>} />
        <Route path="/employe/salaire" element={<EmployeRoute><EmployeSalaire /></EmployeRoute>} />
        <Route path="/employe/rapport" element={<EmployeRoute><EmployeRapport /></EmployeRoute>} />
        <Route path="/employe/projets" element={<EmployeRoute><EmployeProjets /></EmployeRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

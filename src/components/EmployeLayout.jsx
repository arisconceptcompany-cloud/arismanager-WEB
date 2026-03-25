import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Chat from './Chat';
import './Layout.css';

function EmployeLayout({ children }) {
  const navigate = useNavigate();
  const [employe, setEmploye] = useState(JSON.parse(localStorage.getItem('employe_data') || '{}'));
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    loadProfile();
    
    const sendHeartbeat = () => {
      const token = localStorage.getItem('employe_token');
      if (token) {
        fetch(`/api/employe/heartbeat/${token}`, { method: 'POST' })
          .then(res => res.json())
          .then(data => console.log('Heartbeat sent:', data))
          .catch(err => console.error('Heartbeat error:', err));
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('employe_token');
    const empData = localStorage.getItem('employe_data');
    
    if (!token) {
      navigate('/employe-login');
      return;
    }

    try {
      const response = await fetch(`/api/employe/profile/${token}`);
      if (response.ok) {
        const data = await response.json();
        setEmploye(data);
        localStorage.setItem('employe_data', JSON.stringify(data));
        if (data.photo) {
          setPhotoUrl(data.photo);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employe_token');
    localStorage.removeItem('employe_data');
    navigate('/employe-login');
  };

  const menuItems = [
    { path: '/employe/dashboard', icon: 'fa-home', label: 'Tableau de bord' },
    { path: '/employe/profile', icon: 'fa-user', label: 'Mon Profil' },
    { path: '/employe/pointage', icon: 'fa-clock', label: 'Mes Pointages' },
    { path: '/employe/conge', icon: 'fa-calendar', label: 'Mes Congés' },
    { path: '/employe/projets', icon: 'fa-project-diagram', label: 'Projets' },
    { path: '/employe/salaire', icon: 'fa-money-bill', label: 'Mon Salaire' },
    { path: '/employe/rapport', icon: 'fa-chart-bar', label: 'Mon Rapport' },
  ];

  const getInitials = () => {
    return `${(employe.prenom || '')[0] || ''}${(employe.nom || '')[0] || ''}`.toUpperCase();
  };

  return (
    <div className="app-container">
      <div className="slidebar">
        <div className="logo-container">
          {photoUrl ? (
            <img src={photoUrl} alt={employe.prenom} className="logo" style={{ borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div className="logo-placeholder">
              <span>{getInitials()}</span>
            </div>
          )}
          <h4>{employe.prenom || 'Employé'}</h4>
        </div>
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item" key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <i className={`fa ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <img src="/logo.png" alt="ARIS" style={{ width: '35px', height: '35px', marginRight: '10px' }} />
            <div>
              <h5 style={{ margin: 0 }}>ARIS Concept</h5>
              <small className="text-muted">{employe.poste || 'Employé'}</small>
            </div>
          </div>
          <div className="header-right">
            <button className="btn btn-danger btn-sm" onClick={handleLogout} title="Déconnexion">
              <i className="fa fa-sign-out"></i> Déconnexion
            </button>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </div>
      <Chat 
        userType="employee" 
        userId={employe.id} 
        userName={`${employe.prenom || ''} ${employe.nom || ''}`} 
      />
    </div>
  );
}

export default EmployeLayout;

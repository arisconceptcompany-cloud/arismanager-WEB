import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SlideBar from './SlideBar';
import Header from './Header';
import './Layout.css';

function Layout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (!token || !email) {
      navigate('/login');
    } else {
      setUser({ email, token });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };

  if (location.pathname === '/login' || location.pathname === '/register') {
    return <Outlet />;
  }

  return (
    <div className="app-container">
      <SlideBar />
      <div className="main-content">
        <Header user={user} onLogout={handleLogout} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;

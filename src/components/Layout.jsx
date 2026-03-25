import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SlideBar from './SlideBar';
import Header from './Header';
import Chat from './Chat';
import './Layout.css';

function Layout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (location.pathname === '/login' || location.pathname === '/register') {
    return <Outlet />;
  }

  return (
    <div className="app-container">
      <SlideBar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header user={user} onLogout={handleLogout} onToggleSidebar={toggleSidebar} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <Chat userType="admin" userId="1" userName="Admin" />
    </div>
  );
}

export default Layout;

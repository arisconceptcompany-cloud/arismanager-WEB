import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './SlideBar.css';

function SlideBar({ isOpen, onClose }) {
  const menuItems = [
    { path: '/home', icon: 'fa-home', label: 'Accueil' },
    { path: '/employes', icon: 'fa-users', label: 'Employés' },
    { path: '/badges', icon: 'fa-id-card', label: 'Badges' },
    { path: '/presence', icon: 'fa-user-check', label: 'Présence' },
    { path: '/pointage', icon: 'fa-clock', label: 'Pointage' },
    { path: '/projets', icon: 'fa-project-diagram', label: 'Projets' },
    { path: '/conge', icon: 'fa-calendar', label: 'Congés' },
    { path: '/salaire', icon: 'fa-money-bill', label: 'Salaires' },
    { path: '/rapport', icon: 'fa-chart-bar', label: 'Rapports' },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth <= 1024) {
      onClose();
    }
  };

  return (
    <>
      <div className={`slidebar ${isOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <img src="/logo.png" alt="ARIS" className="logo" />
          <h4>ARIS Manager</h4>
        </div>
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item" key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <i className={`fa ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {isOpen && <div className="sidebar-overlay active" onClick={onClose}></div>}
    </>
  );
}

export default SlideBar;

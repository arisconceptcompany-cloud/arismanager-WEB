import { useState, useEffect } from 'react';
import './Header.css';

function Header({ user, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('https://localhost:3000/api/conges/pending');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      loadNotifications();
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <h5>Gestion des Ressources Humaines</h5>
      </div>
      <div className="header-right">
        <div className="notification-container">
          <button 
            className="btn btn-link position-relative"
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <i className="fa fa-bell fs-5"></i>
            {notifications.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {notifications.length}
                <span className="visually-hidden">notifications</span>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h6 className="mb-0">Notifications</h6>
                <button className="btn btn-sm btn-link" onClick={loadNotifications} disabled={loading}>
                  <i className={`fa fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <i className="fa fa-check-circle text-success"></i>
                    <p>Aucune nouvelle demande</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <div className="notification-icon bg-warning">
                        <i className="fa fa-calendar"></i>
                      </div>
                      <div className="notification-content">
                        <strong>{notif.nom} {notif.prenom}</strong>
                        <p className="mb-0 small">
                          Demande de {notif.type_conge}
                          <br />
                          <span className="text-muted">
                            {new Date(notif.date_debut).toLocaleDateString('fr-FR')} - {new Date(notif.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                          <br />
                          <span className="badge bg-warning mt-1">{notif.jours_calcules} jours</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="notification-footer">
                  <small className="text-muted">
                    {notifications.length} demande(s) en attente de traitement
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
        
        <span className="user-name">{user?.email}</span>
        <button className="btn btn-danger btn-sm" onClick={onLogout}>
          <i className="fa fa-sign-out-alt"></i> Déconnexion
        </button>
      </div>
    </header>
  );
}

export default Header;

import { useState, useEffect } from 'react';
import { getPresenceStats, getTodayPresences, getCongesActifs, changeAdminPassword } from '../services/api';
import './Home.css';

function Home() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    congesActifs: 0,
  });
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    
    const eventSource = new EventSource('/api/sse/dashboard');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastScan(data);
        
        const newNotification = {
          id: Date.now(),
          ...data,
          time: new Date().toISOString()
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
        
        if (data.type === 'entrer' || data.type === 'sortie') {
          setPresences(prev => [data, ...prev.slice(0, 19)]);
        }
        
        loadData();
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = () => {
      console.log('SSE connection error - trying to reconnect...');
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const loadData = async () => {
    try {
      const [presenceData, presencesData, congesData] = await Promise.all([
        getPresenceStats(),
        getTodayPresences(),
        getCongesActifs()
      ]);
      
      setStats({
        totalEmployees: presenceData.totalEmployees || 0,
        presentToday: presenceData.presentToday || 0,
        absentToday: presenceData.absentToday || 0,
        congesActifs: congesData?.length || 0,
      });
      setLastScan(presenceData.lastScan || null);
      setPresences(presencesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'entrer': return 'fa-sign-in-alt text-success';
      case 'sortie': return 'fa-sign-out-alt text-warning';
      case 'conge_demande': return 'fa-calendar-plus text-info';
      case 'conge_approuve': return 'fa-check-circle text-success';
      case 'conge_rejete': return 'fa-times-circle text-danger';
      case 'projet_cree': return 'fa-folder-plus text-primary';
      case 'projet_modifie': return 'fa-edit text-primary';
      case 'projet_supprime': return 'fa-trash text-danger';
      default: return 'fa-bell text-secondary';
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);
    try {
      await changeAdminPassword(null, passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <h2 className="page-title">Tableau de bord</h2>
      
      <div className="row mt-4">
        <div className="col-6 col-md-2">
          <div className="card stat-card total">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-users"></i>
              </div>
              <h3>{stats.totalEmployees}</h3>
              <p>Total Employés</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card present">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-user-check"></i>
              </div>
              <h3>{stats.presentToday}</h3>
              <p>Présents</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card inactif">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-user-times"></i>
              </div>
              <h3>{stats.absentToday}</h3>
              <p>Absents</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card conge">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-umbrella-beach"></i>
              </div>
              <h3>{stats.congesActifs}</h3>
              <p>En Congé</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card retard">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-clock"></i>
              </div>
              <h3>{lastScan ? formatTime(lastScan.scanned_at) : '--:--'}</h3>
              <p>Dernier Scan</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-2">
          <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', cursor: 'pointer', minHeight: '140px' }} onClick={() => setShowPasswordModal(true)}>
            <div className="card-body d-flex flex-column justify-content-center align-items-center">
              <div className="stat-icon">
                <i className="fa fa-key"></i>
              </div>
              <p className="mt-2 mb-0 text-white"><small>Mot de passe</small></p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fa fa-qrcode me-2"></i>Pointage en Temps Réel</h5>
              <span className="badge bg-light text-dark">{presences.length} pointages</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Heure</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Poste</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presences.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          Aucun pointage aujourd'hui
                        </td>
                      </tr>
                    ) : (
                      presences.map((presence, index) => (
                        <tr key={presence.id || index} className={presence.type === 'entrer' ? 'table-success' : 'table-warning'}>
                          <td><strong>{formatTime(presence.scanned_at)}</strong></td>
                          <td>{presence.nom}</td>
                          <td>{presence.prenom}</td>
                          <td>{presence.poste || '-'}</td>
                          <td>
                            <span className={`badge ${presence.type === 'entrer' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {presence.type === 'entrer' ? 'Entrée' : 'Sortie'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card notifications-card">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fa fa-bell me-2"></i>Notifications</h5>
              <span className="badge bg-danger">{notifications.length}</span>
            </div>
            <div className="card-body p-0 notifications-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fa fa-inbox fa-2x mb-2"></i>
                  <p className="mb-0">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item p-3 border-bottom ${notif.type === 'entrer' ? 'border-success' : notif.type === 'sortie' ? 'border-warning' : 'border-info'}`}>
                    <div className="d-flex align-items-start">
                      <div className="me-2">
                        <i className={`fa ${getNotificationIcon(notif.type)} fa-lg`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 fw-medium">{notif.message || notif.type}</p>
                        <small className="text-muted">
                          {formatDate(notif.time || notif.scanned_at)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {lastScan && (
        <div className="alert alert-success mt-4 animate__animated animate__fadeIn">
          <i className="fa fa-bell me-2"></i>
          <strong>Dernier scan:</strong> {lastScan.type === 'entrer' ? 'Entrée' : 'Sortie'} de {lastScan.nom} {lastScan.prenom} à {formatTime(lastScan.scanned_at)}
        </div>
      )}

      {showPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Changer le mot de passe</h5>
                <button type="button" className="btn-close" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}></button>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="modal-body">
                  {passwordError && <div className="alert alert-danger">{passwordError}</div>}
                  {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
                  <div className="mb-3">
                    <label className="form-label">Mot de passe actuel</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                    {changingPassword ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa fa-save me-2"></i>}
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;

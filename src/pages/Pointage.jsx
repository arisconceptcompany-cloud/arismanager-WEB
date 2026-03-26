import { useState, useEffect } from 'react';
import { getTodayPresences, getPresenceStats } from '../services/api';
import './Pages.css';

function Pointage() {
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 5000);
    
    const eventSource = new EventSource('/api/sse/dashboard');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        loadData();
        setLastUpdate(new Date());
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = () => {
      console.log('SSE connection error');
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const loadData = async () => {
    try {
      const data = await getTodayPresences();
      setPresences(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBadgeNumber = (badgeId) => {
    if (!badgeId) return '-';
    let num = badgeId.toString();
    num = num.replace(/id$/i, '');
    return num;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getEmployePresences = () => {
    const grouped = {};
    presences.forEach(p => {
      const key = p.employee_id;
      if (!grouped[key]) {
        grouped[key] = {
          employee_id: p.employee_id,
          nom: p.nom,
          prenom: p.prenom,
          poste: p.poste,
          badge_id: p.badge_id,
          arrivee: null,
          depart: null
        };
      }
      if (p.type === 'entrer') {
        grouped[key].arrivee = p.scanned_at;
      } else {
        grouped[key].depart = p.scanned_at;
      }
    });
    return Object.values(grouped);
  };

  const employes = getEmployePresences();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Pointage en Temps Réel</h2>
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted">
            <i className="fa fa-sync me-1"></i>
            Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </small>
          <span className="badge bg-primary fs-6">
            <i className="fa fa-qrcode me-1"></i>
            {employes.length} employé(s) pointé(s)
          </span>
        </div>
      </div>
      
      <div className="alert alert-info mb-4">
        <i className="fa fa-info-circle me-2"></i>
        Les données sont actualisées automatiquement toutes les 5 secondes lors d'un scan.
      </div>
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="fa fa-clock-o me-2"></i>
            Pointages du {formatDate(new Date().toISOString())}
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Badge</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Poste</th>
                  <th>Heure Arrivée</th>
                  <th>Heure Départ</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {employes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      <i className="fa fa-qrcode fa-2x mb-2"></i>
                      <p className="mb-0">Aucun pointage aujourd'hui</p>
                      <small>Scannez un badge pour voir les pointages</small>
                    </td>
                  </tr>
                ) : (
                  employes.map((emp, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge bg-dark fs-6">
                          {formatBadgeNumber(emp.badge_id)}
                        </span>
                      </td>
                      <td><strong>{emp.nom}</strong></td>
                      <td>{emp.prenom}</td>
                      <td>{emp.poste || '-'}</td>
                      <td>
                        {emp.arrivee ? (
                          <span className="badge bg-success fs-6">
                            <i className="fa fa-sign-in me-1"></i>
                            {formatTime(emp.arrivee)}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {emp.depart ? (
                          <span className="badge bg-warning text-dark fs-6">
                            <i className="fa fa-sign-out me-1"></i>
                            {formatTime(emp.depart)}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {emp.arrivee && !emp.depart ? (
                          <span className="badge bg-success">Présent</span>
                        ) : emp.arrivee && emp.depart ? (
                          <span className="badge bg-info">Parti</span>
                        ) : (
                          <span className="badge bg-secondary">Non pointé</span>
                        )}
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
  );
}

export default Pointage;

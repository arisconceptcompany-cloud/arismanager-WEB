import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';

function EmployeDashboard() {
  const [employe, setEmploye] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentPresences, setRecentPresences] = useState([]);
  const [recentConges, setRecentConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('employe_token');
    const empData = localStorage.getItem('employe_data');
    
    if (!token || !empData) {
      navigate('/employe-login');
      return;
    }

    setEmploye(JSON.parse(empData));

    try {
      const [statsRes, presencesRes, congesRes] = await Promise.all([
        fetch(`/api/employe/stats/${token}`),
        fetch(`/api/employe/presences/${token}`),
        fetch(`/api/employe/conges/${token}`)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (presencesRes.ok) {
        const pres = await presencesRes.json();
        setRecentPresences(pres.slice(0, 5));
      }
      if (congesRes.ok) {
        const cong = await congesRes.json();
        setRecentConges(cong.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <EmployeLayout>
      <div className="page-container">
        <div className="welcome-card mb-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h4 className="mb-1">Bienvenue, {employe?.prenom} {employe?.nom} !</h4>
              <p className="text-muted mb-0">
                <i className="fa fa-briefcase me-2"></i>{employe?.poste} 
                <span className="mx-2">|</span>
                <i className="fa fa-id-badge me-2"></i>{employe?.badge_id}
              </p>
            </div>
            <div className="col-md-4 text-end">
              <div className={`badge fs-6 p-3 ${stats?.statut === 'present' ? 'bg-success' : stats?.statut === 'sortie' ? 'bg-warning' : 'bg-secondary'}`}>
                <i className={`fa fa-${stats?.statut === 'present' ? 'check-circle' : stats?.statut === 'sortie' ? 'coffee' : 'times-circle'} me-2`}></i>
                {stats?.statut === 'present' ? 'Présent' : stats?.statut === 'sortie' ? 'En pause' : 'Absent'}
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-start border-primary border-4">
              <div className="card-body text-center">
                <i className="fa fa-calendar-check text-primary" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{stats?.congesRestants || 0}</h3>
                <p className="text-muted mb-0 small">Congés restants</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-start border-success border-4">
              <div className="card-body text-center">
                <i className="fa fa-clock text-success" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{stats?.thisMonth || 0}</h3>
                <p className="text-muted mb-0 small">Présences ce mois</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-start border-info border-4">
              <div className="card-body text-center">
                <i className="fa fa-calendar-alt text-info" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{stats?.totalPresences || 0}</h3>
                <p className="text-muted mb-0 small">Total pointages</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-start border-warning border-4">
              <div className="card-body text-center">
                <i className="fa fa-check text-warning" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{stats?.congesApprouves || 0}</h3>
                <p className="text-muted mb-0 small">Jours de congé pris</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="fa fa-clock me-2"></i>Derniers pointages</h5>
                <button className="btn btn-sm btn-link" onClick={() => navigate('/employe/pointage')}>
                  Voir tout
                </button>
              </div>
              <div className="card-body p-0">
                {recentPresences.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fa fa-calendar-times-o" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2 mb-0">Aucun pointage récent</p>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <tbody>
                      {recentPresences.map((p, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`badge ${p.type === 'entrer' ? 'bg-success' : 'bg-danger'}`}>
                              <i className={`fa fa-${p.type === 'entrer' ? 'sign-in' : 'sign-out'}`}></i>
                            </span>
                          </td>
                          <td>{p.type === 'entrer' ? 'Entrée' : 'Sortie'}</td>
                          <td className="text-end">
                            <strong>{formatTime(p.scanned_at)}</strong>
                            <br />
                            <small className="text-muted">{formatDate(p.scanned_at)}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="fa fa-calendar me-2"></i>Mes congés</h5>
                <button className="btn btn-sm btn-link" onClick={() => navigate('/employe/conge')}>
                  Voir tout
                </button>
              </div>
              <div className="card-body p-0">
                {recentConges.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fa fa-calendar-times-o" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2 mb-0">Aucune demande de congé</p>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <tbody>
                      {recentConges.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.type_conge}</strong>
                            <br />
                            <small className="text-muted">
                              {new Date(c.date_debut).toLocaleDateString('fr-FR')} - {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                            </small>
                          </td>
                          <td className="text-end">
                            <span className={`badge ${
                              c.statut === 'approuve' ? 'bg-success' : 
                              c.statut === 'rejete' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {c.statut === 'approuve' ? 'Approuvé' : c.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                            </span>
                            <br />
                            <small className="text-muted">{c.jours_calcules} jours</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employe/profile'); }} className="text-white text-decoration-none">
                      <i className="fa fa-user fs-4"></i>
                      <div className="mt-2">Mon Profil</div>
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employe/pointage'); }} className="text-white text-decoration-none">
                      <i className="fa fa-clipboard-list fs-4"></i>
                      <div className="mt-2">Pointages</div>
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employe/conge'); }} className="text-white text-decoration-none">
                      <i className="fa fa-calendar-minus fs-4"></i>
                      <div className="mt-2">Congés</div>
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employe/salaire'); }} className="text-white text-decoration-none">
                      <i className="fa fa-money-bill fs-4"></i>
                      <div className="mt-2">Salaire</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeLayout>
  );
}

export default EmployeDashboard;

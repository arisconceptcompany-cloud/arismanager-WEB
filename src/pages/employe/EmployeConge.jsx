import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';

function EmployeConge() {
  const [conges, setConges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newConge, setNewConge] = useState({
    type_conge: 'Congé annuel',
    date_debut: '',
    date_fin: '',
    motif: ''
  });
  const navigate = useNavigate();

  const congeTypes = [
    'Congé annuel',
    'Congé maladie',
    'Congé sans solde',
    'Congé maternite',
    'Congé paternite'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('employe_token');
    if (!token) {
      navigate('/employe-login');
      return;
    }

    try {
      const [congesRes, statsRes] = await Promise.all([
        fetch(`/api/employe/conges/${token}`),
        fetch(`/api/employe/stats/${token}`)
      ]);

      if (congesRes.ok) {
        const data = await congesRes.json();
        setConges(data);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem('employe_token');

    try {
      const response = await fetch(`/api/employe/conges/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConge)
      });

      if (response.ok) {
        setShowForm(false);
        setNewConge({
          type_conge: 'Congé annuel',
          date_debut: '',
          date_fin: '',
          motif: ''
        });
        loadData();
      } else {
        alert('Erreur lors de la demande');
      }
    } catch (err) {
      console.error('Error submitting conge:', err);
      alert('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'approuve':
        return <span className="badge bg-success">Approuvé</span>;
      case 'rejete':
        return <span className="badge bg-danger">Rejeté</span>;
      default:
        return <span className="badge bg-warning">En attente</span>;
    }
  };

  const congesApprouves = conges.filter(c => c.statut === 'approuve').reduce((sum, c) => sum + c.jours_calcules, 0);
  const congesEnAttente = conges.filter(c => c.statut === 'en_attente').length;

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title mb-0">Mes Congés</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <i className={`fa fa-${showForm ? 'times' : 'plus'}`}></i>
            {showForm ? ' Annuler' : ' Nouvelle demande'}
          </button>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <i className="fa fa-calendar-check" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{stats?.congesRestants || 0}</h3>
                <p className="mb-0">Jours restants</p>
                <small>(sur {stats?.congeAnnuelDroit || 30} jours/an)</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <i className="fa fa-check-circle" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{congesApprouves}</h3>
                <p className="mb-0">Jours utilisés</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <i className="fa fa-clock" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{congesEnAttente}</h3>
                <p className="mb-0">En attente</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <i className="fa fa-calendar-minus" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">2.5</h3>
                <p className="mb-0">Jours/semaine</p>
                <small>(congé maladie)</small>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0"><i className="fa fa-calendar-plus me-2"></i>Nouvelle demande de congé</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Type de congé</label>
                      <select 
                        className="form-select"
                        value={newConge.type_conge}
                        onChange={(e) => setNewConge({...newConge, type_conge: e.target.value})}
                        required
                      >
                        {congeTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label">Date de début</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={newConge.date_debut}
                        onChange={(e) => setNewConge({...newConge, date_debut: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label">Date de fin</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={newConge.date_fin}
                        onChange={(e) => setNewConge({...newConge, date_fin: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Motif (optionnel)</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={newConge.motif}
                    onChange={(e) => setNewConge({...newConge, motif: e.target.value})}
                    placeholder="Raison de votre demande de congé..."
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-send me-2"></i>Envoyer la demande
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h5 className="mb-0"><i className="fa fa-history me-2"></i>Historique de mes congés</h5>
          </div>
          <div className="card-body p-0">
            {conges.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="fa fa-calendar-times-o" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Vous n'avez pas encore de demande de congé</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Date début</th>
                      <th>Date fin</th>
                      <th>Jours</th>
                      <th>Motif</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conges.map(conge => (
                      <tr key={conge.id} className={conge.statut === 'en_attente' ? 'table-warning' : ''}>
                        <td><strong>{conge.type_conge}</strong></td>
                        <td>{formatDate(conge.date_debut)}</td>
                        <td>{formatDate(conge.date_fin)}</td>
                        <td><strong>{conge.jours_calcules}</strong> jours</td>
                        <td>{conge.motif || '-'}</td>
                        <td>{getStatutBadge(conge.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeLayout>
  );
}

export default EmployeConge;

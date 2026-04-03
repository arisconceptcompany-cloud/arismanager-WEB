import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function GestionAdmins() {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = async () => {
    try {
      const response = await fetch('/api/employes/all');
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setEmployes(data);
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (employeeId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/employes/' + employeeId + '/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: !currentStatus })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Erreur');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 3000);
      fetchEmployes();
    } catch (err) {
      setError('Erreur de connexion');
      setTimeout(() => setError(''), 3000);
    }
  };

  const isAdmin = (emp) => emp.is_admin === 1 || emp.badge_id === 'ARIS-0001';

  return (
    <div style={{padding: 20}}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fa fa-user-shield me-2"></i>Gestion-Admin</h2>
        <button className="btn btn-primary" onClick={fetchEmployes}>
          <i className="fa fa-sync me-2"></i>Actualiser
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-striped table-bordered table-hover mb-0">
            <thead className="table-dark">
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Prenom</th>
                <th>Poste</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">Chargement...</td></tr>
              ) : employes.length === 0 ? (
                <tr><td colSpan="7" className="text-center">Aucun employee</td></tr>
              ) : (
                employes.map(emp => (
                  <tr key={emp.id} className={isAdmin(emp) ? 'table-success' : ''}>
                    <td><strong>{emp.badge_id}</strong></td>
                    <td>{emp.nom}</td>
                    <td>{emp.prenom}</td>
                    <td>{emp.poste || '-'}</td>
                    <td>{emp.email || '-'}</td>
                    <td>
                      {isAdmin(emp) ? (
                        <span className="badge bg-success"><i className="fa fa-user-shield me-1"></i>Admin</span>
                      ) : (
                        <span className="badge bg-secondary"><i className="fa fa-user me-1"></i>Employe</span>
                      )}
                    </td>
                    <td>
                      {emp.badge_id === 'ARIS-0001' ? (
                        <span className="text-muted">Protege</span>
                      ) : isAdmin(emp) ? (
                        <button className="btn btn-sm btn-danger" onClick={() => toggleAdmin(emp.id, isAdmin(emp))}>
                          <i className="fa fa-user-minus me-1"></i>Retirer Admin
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-success" onClick={() => toggleAdmin(emp.id, isAdmin(emp))}>
                          <i className="fa fa-user-plus me-1"></i>Ajouter Admin
                        </button>
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
  );
}

export default GestionAdmins;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';

function EmployePointage() {
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
  const navigate = useNavigate();

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  useEffect(() => {
    loadPresences();
  }, [filter]);

  const loadPresences = async () => {
    const token = localStorage.getItem('employe_token');
    if (!token) {
      navigate('/employe-login');
      return;
    }

    try {
      const response = await fetch(
        `/api/employe/presences/${token}?mois=${filter.mois}&annee=${filter.annee}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPresences(data);
        }
      }
    } catch (err) {
      console.error('Error loading presences:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    // Handle "YYYY-MM-DD" format from API
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return `${weekdays[d.getDay()]} ${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const calculateHours = (entree, sortie) => {
    if (!entree || !sortie) return '-';
    try {
      const e = new Date(`2000-01-01 ${entree}`);
      const s = new Date(`2000-01-01 ${sortie}`);
      const diffMs = s - e;
      if (diffMs < 0) return '-';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}min`;
    } catch (e) {
      return '-';
    }
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title mb-0">Mes Pointages</h2>
          <div className="d-flex gap-2">
            <select 
              className="form-select" 
              style={{ width: '150px' }}
              value={filter.mois}
              onChange={(e) => setFilter({...filter, mois: parseInt(e.target.value)})}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select 
              className="form-select" 
              style={{ width: '100px' }}
              value={filter.annee}
              onChange={(e) => setFilter({...filter, annee: parseInt(e.target.value)})}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            {!presences || presences.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="fa fa-calendar-times-o" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Aucun pointage enregistré pour cette période</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entrée</th>
                      <th>Sortie</th>
                      <th>Total heures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presences.map((p, index) => (
                      <tr key={p.id || index}>
                        <td>{formatDateDisplay(p.date)}</td>
                        <td>
                          <span className="badge bg-success">
                            <i className="fa fa-sign-in me-1"></i>
                            {p.heure_entree || '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${p.heure_sortie ? 'bg-danger' : 'bg-warning'}`}>
                            <i className="fa fa-sign-out me-1"></i>
                            {p.heure_sortie || 'En cours'}
                          </span>
                        </td>
                        <td>
                          <span className="text-primary fw-bold">
                            {calculateHours(p.heure_entree, p.heure_sortie)}
                          </span>
                        </td>
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

export default EmployePointage;

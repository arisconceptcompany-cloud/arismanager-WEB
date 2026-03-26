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
        setPresences(data);
      }
    } catch (err) {
      console.error('Error loading presences:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const groupByDate = (presences) => {
    const grouped = {};
    presences.forEach(p => {
      const date = p.scanned_at.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(p);
    });
    return grouped;
  };

  const groupedPresences = groupByDate(presences);

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
            {Object.keys(groupedPresences).length === 0 ? (
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
                    {Object.entries(groupedPresences).map(([date, dayPresences]) => {
                      const entrees = dayPresences.filter(p => p.type === 'entrer');
                      const sorties = dayPresences.filter(p => p.type === 'sortie');
                      
                      let totalHours = '';
                      if (entrees.length > 0 && sorties.length > 0) {
                        const firstEntry = new Date(entrees[0].scanned_at);
                        const lastExit = new Date(sorties[sorties.length - 1].scanned_at);
                        const diffMs = lastExit - firstEntry;
                        const hours = Math.floor(diffMs / (1000 * 60 * 60));
                        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        totalHours = `${hours}h ${minutes}min`;
                      }
                      
                      return (
                        <tr key={date}>
                          <td><strong>{formatDate(date + 'T00:00:00')}</strong></td>
                          <td>
                            {entrees.map((e, i) => (
                              <span key={i} className="badge bg-success me-1">
                                {formatTime(e.scanned_at)}
                              </span>
                            ))}
                          </td>
                          <td>
                            {sorties.map((s, i) => (
                              <span key={i} className="badge bg-danger me-1">
                                {formatTime(s.scanned_at)}
                              </span>
                            ))}
                          </td>
                          <td><strong className="text-primary">{totalHours}</strong></td>
                        </tr>
                      );
                    })}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';

function EmployeDashboard() {
  const [employe, setEmploye] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentPresences, setRecentPresences] = useState([]);
  const [recentConges, setRecentConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyPresences, setMonthlyPresences] = useState({});
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
    loadData();
  }, []);

  useEffect(() => {
    loadMonthlyPresences();
  }, [currentMonth, currentYear]);

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
        setRecentPresences(pres.slice(0, 10));
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

  const loadMonthlyPresences = async () => {
    const token = localStorage.getItem('employe_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/employe/presences/${token}?mois=${currentMonth}&annee=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        const presenceMap = {};
        data.forEach(p => {
          const date = p.date || p.scanned_at?.split(' ')[0];
          if (date) {
            if (!presenceMap[date]) {
              presenceMap[date] = { present: false, entry: null, exit: null };
            }
            if (p.type === 'entrer' || p.heure_entree) {
              presenceMap[date].present = true;
              presenceMap[date].entry = p.heure_entree || p.heure;
            }
            if (p.type === 'sortie' || p.heure_sortie) {
              presenceMap[date].exit = p.heure_sortie || p.heure;
            }
          }
        });
        setMonthlyPresences(presenceMap);
      }
    } catch (err) {
      console.error('Error loading monthly presences:', err);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jui', 'jui', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    try {
      const [year, month, day] = dateStr.split('-');
      return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
    } catch {
      return dateStr;
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const isWeekend = (day) => {
    const date = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const getDayStatus = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const presence = monthlyPresences[dateStr];
    
    if (isWeekend(day)) {
      return 'weekend';
    }
    
    if (presence?.present) {
      return 'present';
    }
    
    return 'absent';
  };

  const getPresentDays = () => {
    return Object.values(monthlyPresences).filter(p => p.present).length;
  };

  const getAbsentDays = () => {
    const totalWorkDays = getTotalWorkDays();
    const presentDays = getPresentDays();
    return Math.max(0, totalWorkDays - presentDays);
  };

  const getTotalWorkDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    let workDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (!isWeekend(day)) {
        workDays++;
      }
    }
    return workDays;
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const transformPresencesForDisplay = () => {
    const items = [];
    recentPresences.forEach(p => {
      if (p.heure_entree) {
        items.push({
          type: 'entrer',
          label: 'Entrée',
          time: p.heure_entree,
          date: p.date
        });
      }
      if (p.heure_sortie) {
        items.push({
          type: 'sortie',
          label: 'Sortie',
          time: p.heure_sortie,
          date: p.date
        });
      }
    });
    return items.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateB - dateA;
    }).slice(0, 5);
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

  const displayItems = transformPresencesForDisplay();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

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
                <i className="fa fa-check-circle text-success" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{stats?.thisMonth || 0}</h3>
                <p className="text-muted mb-0 small">Présences ce mois</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-start border-success border-4">
              <div className="card-body text-center">
                <i className="fa fa-calendar-alt text-success" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{getPresentDays()}</h3>
                <p className="text-muted mb-0 small">Jours présents</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-start border-danger border-4">
              <div className="card-body text-center">
                <i className="fa fa-times-circle text-danger" style={{ fontSize: '2rem' }}></i>
                <h3 className="mt-2 mb-1">{getAbsentDays()}</h3>
                <p className="text-muted mb-0 small">Jours absents</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="fa fa-calendar me-2"></i>Calendrier de présence</h5>
                <div className="d-flex align-items-center gap-3">
                  <button className="btn btn-sm btn-outline-primary" onClick={prevMonth}>
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <span className="fw-bold">{months.find(m => m.value === currentMonth)?.label} {currentYear}</span>
                  <button className="btn btn-sm btn-outline-primary" onClick={nextMonth}>
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div className="card-body p-3">
                <div className="calendar-legend mb-3 d-flex gap-4 justify-content-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="calendar-dot bg-success"></span>
                    <small>Présent</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="calendar-dot bg-danger"></span>
                    <small>Absent</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="calendar-dot bg-secondary"></span>
                    <small>Week-end</small>
                  </div>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-header-row">
                    <div className="calendar-day-header">Dim</div>
                    <div className="calendar-day-header">Lun</div>
                    <div className="calendar-day-header">Mar</div>
                    <div className="calendar-day-header">Mer</div>
                    <div className="calendar-day-header">Jeu</div>
                    <div className="calendar-day-header">Ven</div>
                    <div className="calendar-day-header">Sam</div>
                  </div>
                  <div className="calendar-days-grid">
                    {[...Array(firstDay === 0 ? 6 : firstDay - 1)].map((_, i) => (
                      <div key={`empty-${i}`} className="calendar-day empty"></div>
                    ))}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1;
                      const status = getDayStatus(day);
                      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const presence = monthlyPresences[dateStr];
                      
                      return (
                        <div key={day} className={`calendar-day ${status}`} title={presence?.entry ? `Entrée: ${presence.entry}${presence.exit ? ', Sortie: ' + presence.exit : ''}` : ''}>
                          <span className="day-number">{day}</span>
                          {status === 'present' && (
                            <div className="day-indicator">
                              <i className="fa fa-check"></i>
                            </div>
                          )}
                          {status === 'absent' && (
                            <div className="day-indicator">
                              <i className="fa fa-times"></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                {displayItems.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fa fa-calendar-times-o" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2 mb-0">Aucun pointage récent</p>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <tbody>
                      {displayItems.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`badge ${item.type === 'entrer' ? 'bg-success' : 'bg-danger'}`}>
                              <i className={`fa fa-${item.type === 'entrer' ? 'sign-in' : 'sign-out'}`}></i>
                            </span>
                          </td>
                          <td>{item.label}</td>
                          <td className="text-end">
                            <strong>{item.time}</strong>
                            <br />
                            <small className="text-muted">{formatDateDisplay(item.date)}</small>
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
                            <strong>{c.type_conge || c.type}</strong>
                            <br />
                            <small className="text-muted">
                              {c.date_debut} - {c.date_fin}
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
                            <small className="text-muted">{c.jours_calcules || c.jours} jours</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div></div>
    </EmployeLayout>
  );
}

export default EmployeDashboard;

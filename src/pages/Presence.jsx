import { useState, useEffect } from 'react';
import { getAllEmployes, getPresencesByDate, getStatsByDate } from '../services/api';
import jsPDF from 'jspdf';
import './Pages.css';

function Presence() {
  const [employes, setEmployes] = useState([]);
  const [presences, setPresences] = useState([]);
  const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, absentToday: 0, sortieToday: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [employesData, presencesData, statsData] = await Promise.all([
        getAllEmployes(),
        getPresencesByDate(selectedDate),
        getStatsByDate(selectedDate)
      ]);
      
      setEmployes(employesData || []);
      setPresences(presencesData || []);
      setStats(statsData || { totalEmployees: 0, presentToday: 0, absentToday: 0, sortieToday: 0 });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
  };

  const formatBadgeNumber = (badgeId) => {
    if (!badgeId) return '-';
    return badgeId.toString().replace(/id$/i, '');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getEmployePresence = (employeeId) => {
    const empPresences = presences.filter(p => p.employee_id === employeeId);
    let arrivee = null;
    let depart = null;
    
    empPresences.forEach(p => {
      if (p.type === 'entrer' && !arrivee) {
        arrivee = p.scanned_at;
      } else if (p.type === 'sortie') {
        depart = p.scanned_at;
      }
    });
    
    return { arrivee, depart };
  };

  const getCurrentStatus = (emp) => {
    if (emp.status === 'present') return 'Présent';
    if (emp.status === 'sortie') return 'Sorti';
    return 'Absent';
  };

  const getRetard = (arrivee) => {
    if (!arrivee) return null;
    const arriveeTime = new Date(arrivee);
    const hour = arriveeTime.getHours();
    const minute = arriveeTime.getMinutes();
    
    if (hour > 8 || (hour === 8 && minute > 0)) {
      const totalMinutes = (hour - 8) * 60 + minute;
      if (totalMinutes >= 60) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h${m.toString().padStart(2, '0')}min`;
      }
      return `${totalMinutes}min`;
    }
    return null;
  };

  const calculateTotalWorkTime = (arrivee, depart) => {
    if (!arrivee || !depart) return null;
    
    const arriveeTime = new Date(arrivee);
    const departTime = new Date(depart);
    
    const diffMs = departTime - arriveeTime;
    if (diffMs <= 0) return null;
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes, totalMinutes };
  };

  const formatWorkTime = (workTime) => {
    if (!workTime) return '-';
    const { hours, minutes } = workTime;
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  };

  const getWorkTimeStatus = (workTime) => {
    if (!workTime) return 'text-muted';
    if (workTime.totalMinutes >= 480) return 'text-success'; // 8h+
    if (workTime.totalMinutes >= 360) return 'text-warning'; // 6h+
    return 'text-danger';
  };

  const sortedEmployes = [...employes].sort((a, b) => {
    const numA = parseInt((a.badge_id || '').replace('ARIS-', '')) || 0;
    const numB = parseInt((b.badge_id || '').replace('ARIS-', '')) || 0;
    return numA - numB;
  });

  const calculateDayStats = () => {
    let totalEmployeesWithWork = 0;
    let totalMinutesWorked = 0;
    let employeesWithFullDay = 0;

    sortedEmployes.forEach(emp => {
      const { arrivee, depart } = getEmployePresence(emp.id);
      const workTime = calculateTotalWorkTime(arrivee, depart);
      if (workTime) {
        totalEmployeesWithWork++;
        totalMinutesWorked += workTime.totalMinutes;
        if (workTime.totalMinutes >= 480) employeesWithFullDay++;
      }
    });

    const avgMinutes = totalEmployeesWithWork > 0 ? Math.floor(totalMinutesWorked / totalEmployeesWithWork) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;

    return {
      totalEmployeesWithWork,
      avgHours,
      avgMins,
      employeesWithFullDay,
      totalMinutesWorked
    };
  };

  const dayStats = calculateDayStats();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    try {
      doc.addImage('/bg.png', 'PNG', 0, 0, pageWidth, doc.internal.pageSize.getHeight(), '', 'FAST');
    } catch (e) {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    }
    
    const dateDisplay = new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LISTE DES PRESENCES', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${dateDisplay}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 38, pageWidth - margin, 38);
    
    let yPos = 45;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Matricule', margin, yPos);
    doc.text('Nom', margin + 25, yPos);
    doc.text('Poste', margin + 70, yPos);
    doc.text('Statut', margin + 115, yPos);
    doc.text('Arrivee', margin + 145, yPos);
    doc.text('Depart', margin + 165, yPos);
    
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    sortedEmployes.forEach((emp) => {
      if (yPos > 270) {
        doc.addPage();
        try {
          doc.addImage('/bg.png', 'PNG', 0, 0, pageWidth, doc.internal.pageSize.getHeight(), '', 'FAST');
        } catch (e) {}
        yPos = 20;
      }
      
      const { arrivee, depart } = getEmployePresence(emp.id);
      const status = getCurrentStatus(emp);
      
      doc.text((emp.badge_id || '').replace('ARIS-', ''), margin, yPos);
      doc.text((emp.nom || '-').substring(0, 15), margin + 25, yPos);
      doc.text((emp.poste || '-').substring(0, 20), margin + 70, yPos);
      doc.text(status, margin + 115, yPos);
      doc.text(arrivee ? formatTime(arrivee) : '-', margin + 145, yPos);
      doc.text(depart ? formatTime(depart) : '-', margin + 165, yPos);
      
      yPos += 6;
    });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 285, pageWidth - margin, 285);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 292, { align: 'center' });
    
    doc.save(`presence_${selectedDate}.pdf`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const presents = stats.presentToday;
  const sorties = stats.sortieToday || 0;
  const absents = stats.absentToday;

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Gestion des Présences</h2>
        <div className="d-flex align-items-center gap-3">
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '150px' }}
            value={selectedDate}
            onChange={handleDateChange}
          />
          <small className="text-muted">
            <i className="fa fa-sync me-1"></i>
            {lastUpdate.toLocaleTimeString('fr-FR')}
          </small>
          <button className="btn btn-success btn-sm" onClick={handleExportPDF}>
            <i className="fa fa-file-pdf-o me-1"></i> Exporter PDF
          </button>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-6 col-md-2">
          <div className="card stat-card total">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-users"></i>
              </div>
              <h3>{employes.length}</h3>
              <p>Total</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card present">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-user-check"></i>
              </div>
              <h3>{presents}</h3>
              <p>Présents</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card sortie">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-sign-out-alt"></i>
              </div>
              <h3>{sorties}</h3>
              <p>Sortis</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card stat-card inactif">
            <div className="card-body">
              <div className="stat-icon">
                <i className="fa fa-user-times"></i>
              </div>
              <h3>{absents}</h3>
              <p>Absents</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="fa fa-list me-2"></i>
            Liste des présences du jour
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Badge</th>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Statut</th>
                  <th>Arrivée</th>
                  <th>Départ</th>
                  <th>Retard</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <i className="fa fa-users fa-2x text-muted mb-2"></i>
                      <p className="mb-0 text-muted">Aucun employé trouvé</p>
                    </td>
                  </tr>
                ) : (
                  sortedEmployes.map((emp, index) => {
                    const { arrivee, depart } = getEmployePresence(emp.id);
                    const status = getCurrentStatus(emp);
                    const retard = getRetard(arrivee);
                    
                    return (
                      <tr key={emp.id || index}>
                        <td>
                          <span className="badge bg-dark">
                            {formatBadgeNumber(emp.badge_id)}
                          </span>
                        </td>
                        <td><strong>{emp.nom || '-'} {emp.prenom ? emp.prenom.charAt(0) + '.' : ''}</strong></td>
                        <td className="hide-mobile">{emp.poste || '-'}</td>
                        <td>
                          <span className={`badge ${
                            status === 'Présent' ? 'bg-success' : 
                            status === 'Sorti' ? 'bg-warning text-dark' : 'bg-secondary'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          {arrivee ? (
                            <span className="text-success fw-bold">
                              {formatTime(arrivee)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {depart ? (
                            <span className="text-warning fw-bold">
                              {formatTime(depart)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {retard && (
                            <span className="badge bg-danger">
                              {retard}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {/* MOBILE VIEW - Cards */}
            <div className="mobile-cards-view p-2">
              {sortedEmployes.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fa fa-users fa-2x text-muted mb-2"></i>
                  <p className="mb-0 text-muted">Aucun employé trouvé</p>
                </div>
              ) : (
                sortedEmployes.map((emp, index) => {
                  const { arrivee, depart } = getEmployePresence(emp.id);
                  const status = getCurrentStatus(emp);
                  const retard = getRetard(arrivee);
                  
                  return (
                    <div key={emp.id || index} className="mobile-card">
                      <div className="mobile-card-header">
                        <span className="mobile-card-name">{emp.nom || '-'} {emp.prenom || ''}</span>
                        <span className={`badge ${
                          status === 'Présent' ? 'bg-success' : 
                          status === 'Sorti' ? 'bg-warning text-dark' : 'bg-secondary'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="mobile-card-info">
                        <span className="mobile-card-label">Badge:</span>
                        <span className="badge bg-dark">{formatBadgeNumber(emp.badge_id)}</span>
                      </div>
                      <div className="mobile-card-info">
                        <span className="mobile-card-label">Poste:</span>
                        <span className="mobile-card-value">{emp.poste || '-'}</span>
                      </div>
                      <div className="mobile-card-times">
                        <div className="mobile-card-time">
                          <div className="mobile-card-time-label">Arrivée</div>
                          <div className="mobile-card-time-value text-success">
                            {arrivee ? formatTime(arrivee) : '-'}
                          </div>
                        </div>
                        <div className="mobile-card-time">
                          <div className="mobile-card-time-label">Départ</div>
                          <div className="mobile-card-time-value text-warning">
                            {depart ? formatTime(depart) : '-'}
                          </div>
                        </div>
                      </div>
                      {retard && (
                        <div className="mt-2 text-center">
                          <span className="badge bg-danger">
                            <i className="fa fa-clock me-1"></i>
                            Retard: {retard}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h5 className="mb-0">
            <i className="fa fa-clock me-2"></i>
            Temps de Travail Total par Employé
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
                  <th>Temps Total</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <i className="fa fa-clock fa-2x text-muted mb-2"></i>
                      <p className="mb-0 text-muted">Aucun employé trouvé</p>
                    </td>
                  </tr>
                ) : (
                  sortedEmployes.map((emp, index) => {
                    const { arrivee, depart } = getEmployePresence(emp.id);
                    const workTime = calculateTotalWorkTime(arrivee, depart);
                    const status = getCurrentStatus(emp);
                    
                    return (
                      <tr key={emp.id || index}>
                        <td>
                          <span className="badge bg-dark">
                            {formatBadgeNumber(emp.badge_id)}
                          </span>
                        </td>
                        <td><strong>{emp.nom || '-'}</strong></td>
                        <td>{emp.prenom || '-'}</td>
                        <td>{emp.poste || '-'}</td>
                        <td>
                          {arrivee ? (
                            <span className="text-success">
                              <i className="fa fa-sign-in me-1"></i>
                              {formatTime(arrivee)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {depart ? (
                            <span className="text-warning">
                              <i className="fa fa-sign-out me-1"></i>
                              {formatTime(depart)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {workTime ? (
                            <span className={`fw-bold ${getWorkTimeStatus(workTime)}`}>
                              <i className="fa fa-hourglass-half me-1"></i>
                              {formatWorkTime(workTime)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {workTime ? (
                            workTime.totalMinutes >= 480 ? (
                              <span className="badge bg-success">
                                <i className="fa fa-check me-1"></i>
                                Jour complet
                              </span>
                            ) : workTime.totalMinutes >= 360 ? (
                              <span className="badge bg-warning text-dark">
                                <i className="fa fa-exclamation me-1"></i>
                                Partiel
                              </span>
                            ) : (
                              <span className="badge bg-danger">
                                <i className="fa fa-times me-1"></i>
                                Insuffisant
                              </span>
                            )
                          ) : (
                            <span className="badge bg-secondary">
                              <i className="fa fa-minus me-1"></i>
                              Non poinclé
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-light">
          <div className="row text-center">
            <div className="col-3">
              <div className="border-end">
                <h5 className="mb-0 text-primary">{dayStats.totalEmployeesWithWork}</h5>
                <small className="text-muted">Employés pointés</small>
              </div>
            </div>
            <div className="col-3">
              <div className="border-end">
                <h5 className="mb-0 text-success">
                  {dayStats.avgHours}h {dayStats.avgMins.toString().padStart(2, '0')}min
                </h5>
                <small className="text-muted">Moyenne</small>
              </div>
            </div>
            <div className="col-3">
              <div className="border-end">
                <h5 className="mb-0 text-info">{dayStats.employeesWithFullDay}</h5>
                <small className="text-muted">Jours complets (8h+)</small>
              </div>
            </div>
            <div className="col-3">
              <h5 className="mb-0 text-warning">
                {Math.floor(dayStats.totalMinutesWorked / 60)}h {(dayStats.totalMinutesWorked % 60).toString().padStart(2, '0')}min
              </h5>
              <small className="text-muted">Total heures</small>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .stat-card {
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        .stat-card .card-body {
          text-align: center;
          padding: 25px 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .stat-card.present {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .stat-card.present .stat-icon {
          background: rgba(255, 255, 255, 0.25);
        }
        .stat-card.present h3,
        .stat-card.present p {
          color: white;
        }
        .stat-card.total {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        }
        .stat-card.total .stat-icon {
          background: rgba(255, 255, 255, 0.25);
        }
        .stat-card.total h3,
        .stat-card.total p {
          color: white;
        }
        .stat-card.sortie {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .stat-card.sortie .stat-icon {
          background: rgba(255, 255, 255, 0.25);
        }
        .stat-card.sortie h3,
        .stat-card.sortie p {
          color: white;
        }
        .stat-card.inactif {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        .stat-card.inactif .stat-icon {
          background: rgba(255, 255, 255, 0.25);
        }
        .stat-card.inactif h3,
        .stat-card.inactif p {
          color: white;
        }
        .stat-card h3 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }
        .stat-card p {
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

export default Presence;

import { useState, useEffect } from 'react';
import { getAllEmployes, getDashboardStats, getSalariesSummary, getConges } from '../services/api';
import jsPDF from 'jspdf';
import './Pages.css';

function Rapport() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, dashStats, salaryData, congeData] = await Promise.all([
        getAllEmployes(),
        getDashboardStats(),
        getSalariesSummary(),
        getConges()
      ]);
      setEmployees(emps);
      setStats(dashStats);
      setSalaries(salaryData);
      setConges(congeData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const salariesForPeriod = salaries.filter(s => s.mois === period.mois && s.annee === period.annee);
  const totalSalaireBrut = salariesForPeriod.reduce((sum, s) => sum + (s.salaire_base || 0) + (s.primes || 0), 0);
  const totalSalaireNet = salariesForPeriod.reduce((sum, s) => sum + (s.salaire_net || 0), 0);
  const totalCNAPS = salariesForPeriod.reduce((sum, s) => sum + (s.cnaps || 0), 0);
  const totalOSTIE = salariesForPeriod.reduce((sum, s) => sum + (s.ostie || 0), 0);
  const totalIRSA = salariesForPeriod.reduce((sum, s) => sum + (s.irsa || 0), 0);

  const congesApprouves = conges.filter(c => c.statut === 'approuve').length;
  const congesEnAttente = conges.filter(c => c.statut === 'en_attente').length;
  const congesRejetes = conges.filter(c => c.statut === 'rejete').length;

  const congeTypes = conges.reduce((acc, c) => {
    acc[c.type_conge] = (acc[c.type_conge] || 0) + 1;
    return acc;
  }, {});

  const postesCount = employees.reduce((acc, emp) => {
    const poste = emp.poste || 'Non défini';
    acc[poste] = (acc[poste] || 0) + 1;
    return acc;
  }, {});

  const formatAr = (value) => (value || 0).toLocaleString('fr-FR') + ' Ar';

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Add background image
    try {
      doc.addImage('/bg.png', 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    } catch (e) {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }
    
    // Title
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT MENSUEL', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${months.find(m => m.value === period.mois)?.label} ${period.annee}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 38, pageWidth - margin, 38);
    
    let yPos = 48;
    
    // Section 1: Statistiques
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIQUES GENERALES', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Employes: ${employees.length}`, margin, yPos);
    yPos += 5;
    doc.text(`Presents: ${stats?.presentToday || 0}`, margin, yPos);
    yPos += 5;
    doc.text(`Absents: ${stats?.absentToday || 0}`, margin, yPos);
    yPos += 5;
    doc.text(`En Conge: ${congesApprouves}`, margin, yPos);
    yPos += 12;
    
    // Section 2: Salaires
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MASSES SALARIALES', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Salaire Brut: ${formatAr(totalSalaireBrut)}`, margin, yPos);
    yPos += 5;
    doc.text(`Salaire Net: ${formatAr(totalSalaireNet)}`, margin, yPos);
    yPos += 5;
    doc.text(`CNAPS: ${formatAr(totalCNAPS)}`, margin, yPos);
    yPos += 5;
    doc.text(`OSTIE: ${formatAr(totalOSTIE)}`, margin, yPos);
    yPos += 5;
    doc.text(`IRSA: ${formatAr(totalIRSA)}`, margin, yPos);
    yPos += 12;
    
    // Section 3: Conges
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUT DES CONGES', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Approuves: ${congesApprouves}`, margin, yPos);
    yPos += 5;
    doc.text(`En attente: ${congesEnAttente}`, margin, yPos);
    yPos += 5;
    doc.text(`Rejetes: ${congesRejetes}`, margin, yPos);
    yPos += 12;
    
    // Section 4: Postes
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPARTITION PAR POSTE', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(postesCount).forEach(([poste, count]) => {
      doc.text(`- ${poste}: ${count}`, margin, yPos);
      yPos += 5;
    });
    
    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.save(`rapport_${period.mois}_${period.annee}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Poste', 'Salaire Base', 'Primes', 'Salaire Net'];
    const rows = salariesForPeriod.map(s => [
      s.badge_id,
      s.nom,
      s.prenom,
      s.poste,
      s.salaire_base,
      s.primes,
      s.salaire_net
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salaires_${period.mois}_${period.annee}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <h2 className="page-title">Rapports et Statistiques</h2>
        <div className="d-flex gap-2">
          <select 
            className="form-select" 
            style={{ width: '150px' }}
            value={period.mois}
            onChange={(e) => setPeriod({...period, mois: parseInt(e.target.value)})}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select 
            className="form-select" 
            style={{ width: '100px' }}
            value={period.annee}
            onChange={(e) => setPeriod({...period, annee: parseInt(e.target.value)})}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={loadData}>
            <i className="fa fa-refresh"></i>
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">{employees.length}</h3>
              <p className="mb-0">Total Employés</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">{stats?.presentToday || 0}</h3>
              <p className="mb-0">Présents Aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">{stats?.absentToday || 0}</h3>
              <p className="mb-0">Absents Aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">{congesEnAttente}</h3>
              <p className="mb-0">Congés en Attente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Masse Salariale</h5>
              <span className="badge bg-secondary">{months.find(m => m.value === period.mois)?.label} {period.annee}</span>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td>Salaire Brut Total:</td>
                    <td className="text-end"><strong>{formatAr(totalSalaireBrut)}</strong></td>
                  </tr>
                  <tr>
                    <td>Salaire Net Total:</td>
                    <td className="text-end text-success"><strong>{formatAr(totalSalaireNet)}</strong></td>
                  </tr>
                  <tr className="text-muted">
                    <td>CNAPS (1%):</td>
                    <td className="text-end">{formatAr(totalCNAPS)}</td>
                  </tr>
                  <tr className="text-muted">
                    <td>OSTIE (1%):</td>
                    <td className="text-end">{formatAr(totalOSTIE)}</td>
                  </tr>
                  <tr className="text-muted">
                    <td>IRSA:</td>
                    <td className="text-end">{formatAr(totalIRSA)}</td>
                  </tr>
                </tbody>
              </table>
              <button className="btn btn-outline-primary btn-sm w-100" onClick={handleExportCSV}>
                <i className="fa fa-download"></i> Exporter CSV
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Statut des Congés</h5>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td><span className="badge bg-success">Approuvés</span></td>
                    <td className="text-end"><strong>{congesApprouves}</strong></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-warning">En attente</span></td>
                    <td className="text-end"><strong>{congesEnAttente}</strong></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-danger">Rejetés</span></td>
                    <td className="text-end"><strong>{congesRejetes}</strong></td>
                  </tr>
                </tbody>
              </table>
              <hr />
              <h6>Par type de congé:</h6>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(congeTypes).map(([type, count]) => (
                  <span key={type} className="badge bg-secondary">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Répartition par Poste</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {Object.entries(postesCount).map(([poste, count]) => (
              <div key={poste} className="col-md-4 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span>{poste}</span>
                  <span className="badge bg-primary">{count}</span>
                </div>
                <div className="progress mt-1" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-primary" 
                    style={{ width: `${(count / employees.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Export du Rapport</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <button className="btn btn-success w-100" onClick={handleExportPDF}>
                <i className="fa fa-file-pdf-o"></i> Exporter en PDF
              </button>
              <small className="text-muted d-block mt-2">Exporte un rapport détaillé en format PDF</small>
            </div>
            <div className="col-md-6">
              <button className="btn btn-info w-100" onClick={handleExportCSV}>
                <i className="fa fa-table"></i> Exporter Salaires CSV
              </button>
              <small className="text-muted d-block mt-2">Exporte les données salariales en format Excel</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rapport;

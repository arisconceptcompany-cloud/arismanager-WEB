import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';
import jsPDF from 'jspdf';

function EmployeRapport() {
  const [employe, setEmploye] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [presences, setPresences] = useState([]);
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
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

  const loadData = async () => {
    const token = localStorage.getItem('employe_token');
    const empData = localStorage.getItem('employe_data');
    
    if (!token || !empData) {
      navigate('/employe-login');
      return;
    }

    setEmploye(JSON.parse(empData));

    try {
      const [salariesRes, presencesRes, congesRes] = await Promise.all([
        fetch(`/api/employe/salaires/${token}`),
        fetch(`/api/employe/presences/${token}`),
        fetch(`/api/employe/conges/${token}`)
      ]);

      if (salariesRes.ok) setSalaries(await salariesRes.json());
      if (presencesRes.ok) setPresences(await presencesRes.json());
      if (congesRes.ok) setConges(await congesRes.json());
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAr = (value) => (value || 0).toLocaleString('fr-FR') + ' Ar';

  const salariesForPeriod = salaries.filter(s => s.mois === period.mois && s.annee === period.annee);
  const presencesForPeriod = presences.filter(p => {
    const date = new Date(p.scanned_at);
    return date.getMonth() + 1 === period.mois && date.getFullYear() === period.annee;
  });
  const congesForPeriod = conges.filter(c => {
    return c.statut === 'approuve';
  });

  const totalSalaireBrut = salariesForPeriod.reduce((sum, s) => sum + (s.salaire_base || 0) + (s.primes || 0) + (s.heures_supplementaires || 0), 0);
  const totalSalaireNet = salariesForPeriod.reduce((sum, s) => sum + (s.salaire_net || 0), 0);
  const totalCNAPS = salariesForPeriod.reduce((sum, s) => sum + (s.cnaps || 0), 0);
  const totalIRSA = salariesForPeriod.reduce((sum, s) => sum + (s.irsa || 0), 0);

  const exportRapport = () => {
    const rapportContent = `
================================================================================
RAPPORT PERSONNEL - ${employe?.prenom} ${employe?.nom}
================================================================================
Matricule: ${employe?.badge_id}
Poste: ${employe?.poste}
Période: ${months.find(m => m.value === period.mois)?.label} ${period.annee}
Généré le: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
================================================================================

1. RÉSUMÉ DU MOIS
------------------
Présences enregistrées: ${presencesForPeriod.length}
Jours de congé approuvés: ${congesForPeriod.length}

2. SALAIRE (${months.find(m => m.value === period.mois)?.label} ${period.annee})
--------------------------------------------------------------------------------
Salaire Brut: ${formatAr(totalSalaireBrut)}
Salaire Net: ${formatAr(totalSalaireNet)}
CNAPS: ${formatAr(totalCNAPS)}
IRSA: ${formatAr(totalIRSA)}

3. HISTORIQUE DES SALAIRES
--------------------------------------------------------------------------------
${salaries.slice(0, 6).map(s => 
  `${months.find(m => m.value === s.mois)?.label} ${s.annee}: ${formatAr(s.salaire_net)}`
).join('\n')}

================================================================================
ARIS Concept Company - Document personnel confidentiel
================================================================================
    `;

    const blob = new Blob([rapportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${employe?.badge_id}_${period.mois}_${period.annee}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFichePaiePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Fond blanc
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Logo
    try {
      doc.addImage('/logo.png', 'PNG', margin, 10, 25, 25);
    } catch (e) {}
    
    // Titre
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ARIS CONCEPT COMPANY', margin + 30, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('FICHE DE PAIE', margin + 30, 28);
    
    let yPos = 45;
    
    // Tableau principal
    const tableX = margin;
    const tableWidth = pageWidth - 2 * margin;
    const col1 = 80;
    const col2 = tableWidth - col1;
    
    // En-tête du tableau
    doc.setFillColor(220, 220, 220);
    doc.rect(tableX, yPos, tableWidth, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DESIGNATION', tableX + 3, yPos + 5.5);
    doc.text('MONTANT', tableX + tableWidth - 3, yPos + 5.5, { align: 'right' });
    yPos += 8;
    
    // Ligne
    doc.setDrawColor(200, 200, 200);
    doc.line(tableX, yPos, tableX + tableWidth, yPos);
    yPos += 2;
    
    const rows = [
      { label: 'SALAIRE DE BASE', value: salariesForPeriod[0]?.salaire_base || 0 },
      { label: 'Primes', value: salariesForPeriod[0]?.primes || 0, indent: true },
      { label: 'Heures supplementaires', value: salariesForPeriod[0]?.heures_supplementaires || 0, indent: true },
      { label: 'SALAIRE BRUT', value: totalSalaireBrut, bold: true },
      { label: '', value: 0, spacer: true },
      { label: 'CNAPS (1%)', value: salariesForPeriod[0]?.cnaps || 0, indent: true },
      { label: 'OSTIE (1%)', value: salariesForPeriod[0]?.ostie || 0, indent: true },
      { label: 'IRSA', value: salariesForPeriod[0]?.irsa || 0, indent: true },
      { label: 'Autres retenues', value: salariesForPeriod[0]?.autres_retenues || 0, indent: true },
      { label: '', value: 0, spacer: true },
      { label: 'NET A PAYER', value: totalSalaireNet, bold: true, highlight: true },
    ];
    
    rows.forEach((row) => {
      if (row.spacer) {
        yPos += 5;
        return;
      }
      
      if (row.bold) {
        doc.setDrawColor(100, 100, 100);
        doc.line(tableX, yPos, tableX + tableWidth, yPos);
        yPos += 2;
      }
      
      if (row.highlight) {
        doc.setFillColor(240, 240, 240);
        doc.rect(tableX, yPos, tableWidth, 7, 'F');
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
      const xLabel = row.indent ? tableX + 10 : tableX + 3;
      doc.text(row.label, xLabel, yPos + 5);
      doc.text(formatAr(row.value), tableX + tableWidth - 3, yPos + 5, { align: 'right' });
      yPos += row.highlight ? 7 : 6;
    });
    
    yPos += 10;
    
    // Informations empleado
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employe: ${employe?.prenom} ${employe?.nom}`, tableX, yPos);
    yPos += 5;
    doc.text(`Matricule: ${(employe?.badge_id || '').replace('ARIS-', '')}`, tableX, yPos);
    yPos += 5;
    doc.text(`Poste: ${employe?.poste || '-'}`, tableX, yPos);
    yPos += 5;
    doc.text(`Periode: ${months.find(m => m.value === period.mois)?.label} ${period.annee}`, tableX, yPos);
    
    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.save(`fiche_paie_${employe?.badge_id}_${period.mois}_${period.annee}.pdf`);
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
          <h2 className="page-title mb-0">Mon Rapport</h2>
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
            <button className="btn btn-success" onClick={exportRapport}>
              <i className="fa fa-download"></i> Exporter
            </button>
            <button className="btn btn-primary" onClick={exportFichePaiePDF}>
              <i className="fa fa-file-pdf-o"></i> Fiche de paie PDF
            </button>
          </div>
        </div>

        <div className="alert alert-info mb-4">
          <i className="fa fa-info-circle me-2"></i>
          <strong>Rapport confidentiel</strong> - Ce rapport est personnel et contient vos données privées.
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h3 className="mb-0">{presencesForPeriod.length}</h3>
                <p className="mb-0">Pointages ce mois</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h3 className="mb-0">{congesForPeriod.length}</h3>
                <p className="mb-0">Jours de congé</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h3 className="mb-0">{formatAr(totalSalaireBrut)}</h3>
                <p className="mb-0">Salaire Brut</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h3 className="mb-0">{formatAr(totalSalaireNet)}</h3>
                <p className="mb-0">Salaire Net</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0"><i className="fa fa-money-bill me-2"></i>Mon Salaire</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <tbody>
                    <tr>
                      <td>Salaire de base:</td>
                      <td className="text-end">{formatAr(salariesForPeriod[0]?.salaire_base || 0)}</td>
                    </tr>
                    <tr>
                      <td>Primes:</td>
                      <td className="text-end text-success">+ {formatAr(salariesForPeriod[0]?.primes || 0)}</td>
                    </tr>
                    <tr>
                      <td>Heures sup.:</td>
                      <td className="text-end text-success">+ {formatAr(salariesForPeriod[0]?.heures_supplementaires || 0)}</td>
                    </tr>
                    <tr className="border-top">
                      <td><strong>Brut:</strong></td>
                      <td className="text-end"><strong>{formatAr(totalSalaireBrut)}</strong></td>
                    </tr>
                    <tr>
                      <td>CNAPS:</td>
                      <td className="text-end text-danger">- {formatAr(totalCNAPS)}</td>
                    </tr>
                    <tr>
                      <td>IRSA:</td>
                      <td className="text-end text-danger">- {formatAr(totalIRSA)}</td>
                    </tr>
                    <tr className="border-top border-bottom bg-light">
                      <td><strong>Net à payer:</strong></td>
                      <td className="text-end text-success"><strong>{formatAr(totalSalaireNet)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0"><i className="fa fa-history me-2"></i>Historique des salaires</h5>
              </div>
              <div className="card-body p-0">
                {salaries.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>Aucun historique disponible</p>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Période</th>
                        <th className="text-end">Salaire Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.slice(0, 6).map(s => (
                        <tr key={s.id}>
                          <td>{months.find(m => m.value === s.mois)?.label} {s.annee}</td>
                          <td className="text-end text-success">{formatAr(s.salaire_net)}</td>
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
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0"><i className="fa fa-calendar me-2"></i>Mes congés</h5>
              </div>
              <div className="card-body p-0">
                {conges.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>Aucune demande de congé</p>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Date début</th>
                        <th>Date fin</th>
                        <th>Jours</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conges.slice(0, 5).map(c => (
                        <tr key={c.id}>
                          <td>{c.type_conge}</td>
                          <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                          <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                          <td>{c.jours_calcules}</td>
                          <td>
                            <span className={`badge ${
                              c.statut === 'approuve' ? 'bg-success' : 
                              c.statut === 'rejete' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {c.statut === 'approuve' ? 'Approuvé' : c.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                            </span>
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
      </div>
    </EmployeLayout>
  );
}

export default EmployeRapport;

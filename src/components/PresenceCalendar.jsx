import { useState, useMemo } from 'react';

function PresenceCalendar({ presences }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const presenceDays = useMemo(() => {
    const days = new Set();
    if (presences && presences.length > 0) {
      presences.forEach(p => {
        if (p.scanned_at) {
          const parts = p.scanned_at.split(' ')[0].split('-');
          const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
          days.add(dateStr);
        }
      });
    }
    return days;
  }, [presences]);

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, dateStr: null, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr, isCurrentMonth: true });
    }
    
    while (days.length % 7 !== 0) {
      days.push({ day: null, dateStr: null, isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayStatus = (dayData) => {
    if (!dayData.dateStr || !dayData.isCurrentMonth) return 'empty';
    
    const dateObj = new Date(dayData.dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    
    const todayCompare = new Date(today);
    todayCompare.setHours(0, 0, 0, 0);
    
    if (dateObj.getTime() === todayCompare.getTime()) return 'today';
    if (dateObj > todayCompare) return 'future';
    if (presenceDays.has(dayData.dateStr)) return 'present';
    return 'absent';
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    
    getMonthDays.forEach(dayData => {
      if (!dayData.dateStr || !dayData.isCurrentMonth) return;
      
      const dateObj = new Date(dayData.dateStr + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return;
      
      const todayCompare = new Date(today);
      todayCompare.setHours(0, 0, 0, 0);
      if (dateObj > todayCompare) return;
      
      if (presenceDays.has(dayData.dateStr)) {
        present++;
      } else {
        absent++;
      }
    });
    
    return { present, absent };
  }, [getMonthDays, presenceDays, today]);

  return (
    <div className="presence-calendar-card">
      <div className="calendar-header">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <h5 className="mb-0 fw-bold">
              <i className="fa fa-calendar-check me-2"></i>
              Calendrier de Présence
            </h5>
            <small className="opacity-75">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-light rounded-circle" onClick={prevMonth} style={{ width: '36px', height: '36px', padding: '0' }}>
              <i className="fa fa-chevron-left"></i>
            </button>
            <button className="btn btn-sm btn-light rounded-circle" onClick={nextMonth} style={{ width: '36px', height: '36px', padding: '0' }}>
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="calendar-body">
        <div className="row g-2 mb-3">
          <div className="col-4">
            <div className="stat-card stat-present">
              <div className="stat-icon"><i className="fa fa-check-circle"></i></div>
              <div className="stat-number">{stats.present}</div>
              <div className="stat-label">Présent</div>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card stat-absent">
              <div className="stat-icon"><i className="fa fa-times-circle"></i></div>
              <div className="stat-number">{stats.absent}</div>
              <div className="stat-label">Absent</div>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card stat-today">
              <div className="stat-icon"><i className="fa fa-calendar-day"></i></div>
              <div className="stat-number">
                {currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() 
                  ? today.getDate() 
                  : '-'}
              </div>
              <div className="stat-label">Aujourd'hui</div>
            </div>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="row g-1 text-center mb-1">
            {weekDays.map((day, idx) => (
              <div key={idx} className={`col fw-bold text-uppercase py-2 week-day-header ${idx >= 5 ? 'text-danger' : 'text-secondary'}`}>
                {day}
              </div>
            ))}
          </div>
          
          <div className="row g-1">
            {getMonthDays.map((dayData, index) => {
              const status = getDayStatus(dayData);
              const weekIndex = Math.floor(index / 7);
              const dayIndex = index % 7;
              
              let dayBadge = null;
              if (dayData.day !== null) {
                const dateCheck = new Date(dayData.dateStr + 'T00:00:00');
                const dayOfWeek = dateCheck.getDay();
                dayBadge = weekDays[dayIndex];
              }
              
              return (
                <div key={index} className="col p-0">
                  <div className={`calendar-day ${status}`}>
                    {dayData.day !== null ? (
                      <>
                        <div className="day-week-badge">{dayBadge}</div>
                        <div className="day-number">{dayData.day}</div>
                        {status === 'present' && (
                          <div className="day-indicator present-indicator">
                            <i className="fa fa-check"></i>
                          </div>
                        )}
                        {status === 'absent' && (
                          <div className="day-indicator absent-indicator">
                            <i className="fa fa-times"></i>
                          </div>
                        )}
                        {status === 'today' && (
                          <div className="day-indicator today-indicator">Maintenant</div>
                        )}
                      </>
                    ) : (
                      <div className="empty-day"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="calendar-legend mt-4 pt-3 border-top">
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <div className="legend-item">
              <span className="legend-box legend-present"></span>
              <span>Présent</span>
            </div>
            <div className="legend-item">
              <span className="legend-box legend-absent"></span>
              <span>Absent</span>
            </div>
            <div className="legend-item">
              <span className="legend-box legend-today"></span>
              <span>Aujourd'hui</span>
            </div>
            <div className="legend-item">
              <span className="legend-box legend-weekend"></span>
              <span>Weekend</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .presence-calendar-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        
        .calendar-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 20px 24px;
        }
        
        .calendar-header h5 {
          font-size: 1.1rem;
        }
        
        .calendar-body {
          padding: 20px;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f0f0;
        }
        
        .stat-icon {
          font-size: 18px;
          margin-bottom: 4px;
        }
        
        .stat-present .stat-icon { color: #22c55e; }
        .stat-absent .stat-icon { color: #ef4444; }
        .stat-today .stat-icon { color: #3b82f6; }
        
        .stat-present { border-left: 4px solid #22c55e; }
        .stat-absent { border-left: 4px solid #ef4444; }
        .stat-today { border-left: 4px solid #3b82f6; }
        
        .stat-number {
          font-size: 26px;
          font-weight: 700;
          line-height: 1;
        }
        
        .stat-present .stat-number { color: #22c55e; }
        .stat-absent .stat-number { color: #ef4444; }
        .stat-today .stat-number { color: #3b82f6; }
        
        .stat-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .calendar-grid {
          font-size: 0.85rem;
        }
        
        .week-day-header {
          font-size: 0.7rem;
          letter-spacing: 0.5px;
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s ease;
          cursor: default;
          min-height: 65px;
          position: relative;
          margin: 2px 0;
        }
        
        .calendar-day.empty {
          background: transparent;
        }
        
        .calendar-day.present {
          background: linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%);
          border: 2px solid #22c55e;
          color: #15803d;
        }
        
        .calendar-day.absent {
          background: linear-gradient(180deg, #fee2e2 0%, #fecaca 100%);
          border: 2px solid #ef4444;
          color: #dc2626;
        }
        
        .calendar-day.today {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
          z-index: 2;
        }
        
        .calendar-day.weekend {
          background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #94a3b8;
        }
        
        .calendar-day.future {
          background: #fafafa;
          color: #d1d5db;
        }
        
        .calendar-day:not(.empty):hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          z-index: 1;
        }
        
        .calendar-day.today:hover {
          transform: scale(1.08);
        }
        
        .day-week-badge {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .day-number {
          font-size: 1.3rem;
          font-weight: 700;
          line-height: 1;
          margin-top: 8px;
        }
        
        .day-indicator {
          font-size: 10px;
          font-weight: 600;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 10px;
        }
        
        .present-indicator {
          background: rgba(34, 197, 94, 0.3);
          color: #15803d;
        }
        
        .absent-indicator {
          background: rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }
        
        .today-indicator {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 8px;
        }
        
        .calendar-day.today .day-week-badge {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .calendar-day.today .day-number {
          font-size: 1.5rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #6b7280;
        }
        
        .legend-box {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 2px solid;
        }
        
        .legend-present {
          background: linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%);
          border-color: #22c55e;
        }
        
        .legend-absent {
          background: linear-gradient(180deg, #fee2e2 0%, #fecaca 100%);
          border-color: #ef4444;
        }
        
        .legend-today {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          border-color: #3b82f6;
        }
        
        .legend-weekend {
          background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
          border-color: #94a3b8;
        }
        
        @media (max-width: 768px) {
          .calendar-body {
            padding: 12px;
          }
          .calendar-day {
            min-height: 55px;
            border-radius: 8px;
          }
          .day-number {
            font-size: 1.1rem;
          }
          .day-week-badge {
            font-size: 8px;
          }
          .stat-card {
            padding: 10px 8px;
          }
          .stat-number {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}

export default PresenceCalendar;

import { useState, useEffect } from 'react';

export default function Reports({ API_BASE_URL, setLoading }) {
  const [generalStats, setGeneralStats] = useState(null);
  const [assigneeStats, setAssigneeStats] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [resGen, resAss] = await Promise.all([
        fetch(`${API_BASE_URL}/stats/general`), 
        fetch(`${API_BASE_URL}/stats/assignees`)
      ]);
      if (resGen.ok) setGeneralStats(await resGen.json());
      if (resAss.ok) setAssigneeStats((await resAss.json()).results || []);
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="reports-grid">
      <div className="card stat-card overdue">
        <h4>Просрочено заявок в системе:</h4>
        <div className="huge-number">{generalStats?.overdue_count || 0}</div>
      </div>

      <div className="card">
        <h4>Заявки по статусам</h4>
        <div className="status-bars">
          {generalStats?.by_status?.map(item => (
            <div key={item.status} className="status-bar-row">
              <span className="status-label">{item.status}:</span>
              <strong>{item.count} шт.</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card wide-card">
        <h4>Эффективность (Количество выполненных заявок по исполнителям)</h4>
        <table>
          <thead>
            <tr>
              <th>ID Исполнителя</th>
              <th>ФИО Сотрудника</th>
              <th>Выполнено успешно</th>
            </tr>
          </thead>
          <tbody>
            {assigneeStats.length === 0 ? (
              <tr><td colSpan="3" className="no-data">Пока никто не закрыл ни одной заявки</td></tr>
            ) : (
              assigneeStats.map(row => (
                <tr key={row.assignee_id}>
                  <td>{row.assignee_id}</td>
                  <td>{row.fullname}</td>
                  <td><b className="success-text">{row.count} шт.</b></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
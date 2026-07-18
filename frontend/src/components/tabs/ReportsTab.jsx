import { useState, useEffect } from 'react';
import Pagination from '../Pagination'; // Убедитесь, что путь верный

export default function Reports({ API_BASE_URL, setLoading }) {
  const [generalStats, setGeneralStats] = useState(null);
  const [assigneeStats, setAssigneeStats] = useState([]);
  const [assigneePage, setAssigneePage] = useState(1);
  const [totalAssignees, setTotalAssignees] = useState(0);
  const limit = 25; // Лимит как на бэкенде

  const totalPages = Math.ceil(totalAssignees / limit) || 1;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const offset = (assigneePage - 1) * limit;
      
      // Параллельные запросы
      const [resGen, resAss] = await Promise.all([
        fetch(`${API_BASE_URL}/stats/general`), 
        fetch(`${API_BASE_URL}/stats/assignees?limit=${limit}&offset=${offset}`)
      ]);
      
      if (resGen.ok) setGeneralStats(await resGen.json());
      
      if (resAss.ok) {
        const assData = await resAss.json();
        setAssigneeStats(assData.results || []);
        setTotalAssignees(assData.total || 0);
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  // Перезагружаем только список исполнителей при смене страницы
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assigneePage]);

  return (
    <div className="reports-grid">
      <div className="card stat-card overdue">
        <h4>Просрочено заявок в системе всего:{generalStats?.overdue_count || 0}</h4>
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
        <h4>Количество выполненных заявок по исполнителям</h4>
        <table>
          <tbody>
            {assigneeStats.map(row => (
              <tr key={row.assignee_id}>
                <td>{row.assignee_id}</td>
                <td>{row.fullname}</td>
                <td><b className="success-text">{row.count} шт.</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Добавляем пагинацию под таблицей */}
        <Pagination 
          currentPage={assigneePage} 
          totalPages={totalPages} 
          onPageChange={setAssigneePage} 
        />
      </div>
    </div>
  );
}
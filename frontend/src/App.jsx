import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = `http://${window.location.hostname}:8000`;

function App() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(false);

  // --- СОСТОЯНИЯ ЗАЯВОК ---
  const [tickets, setTickets] = useState([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketPage, setTicketPage] = useState(1);
  const ticketLimit = 10;

  // Фильтры и сортировка
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isOverdueFilter, setIsOverdueFilter] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
  
  const [ticketSortBy, setTicketSortBy] = useState('deadline');
  const [ticketSortOrder, setTicketSortOrder] = useState('asc');

  // Форма создания заявки
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAuthorId, setNewAuthorId] = useState('');
  const [createError, setCreateError] = useState('');
  const [editStates, setEditStates] = useState({});

  // --- СОСТОЯНИЯ ДЛЯ ДРУГИХ ВКЛАДОК ---
  const [employees, setEmployees] = useState([]);
  const [empTotal, setEmpTotal] = useState(0);
  const [empSortBy, setEmpSortBy] = useState('id');
  const [empSortOrder, setEmpSortOrder] = useState('asc');
  const [generalStats, setGeneralStats] = useState(null);
  const [assigneeStats, setAssigneeStats] = useState([]);

  const totalPages = Math.ceil(ticketsTotal / ticketLimit) || 1;


  // Добавьте это в начало вашего компонента
  const [empOffset, setEmpOffset] = useState(0);
  const [empLimit] = useState(24); // Лимит на страницу


  // Функция для загрузки данных (вызывайте её при изменении empOffset или sort)
  // const fetchEmployees = async () => {
  //   const response = await fetch(
  //     `/api/employee/?limit=${empLimit}&offset=${empOffset}&sorted_by=${empSortBy}&sorted_order=${empSortOrder}`
  //   );
  //   const data = await response.json();
  //   setEmployees(data.results);
  //   setEmpTotal(data.total);
  // };

  // Сброс страницы при изменении ЛЮБЫХ фильтров
  useEffect(() => {
    setTicketPage(1);
  }, [statusFilter, assigneeFilter, departmentFilter, isOverdueFilter, deadlineFrom, deadlineTo]);

  // --- ФУНКЦИИ ЗАГРУЗКИ ---
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const offset = (ticketPage - 1) * ticketLimit;
      const params = new URLSearchParams({
        sorted_by: ticketSortBy,
        sorted_order: ticketSortOrder,
        limit: ticketLimit,
        offset: offset
      });

      if (statusFilter) params.append('status', statusFilter);
      if (assigneeFilter) params.append('assignee_id', assigneeFilter);
      if (departmentFilter) params.append('department_id', departmentFilter);
      if (isOverdueFilter !== '') params.append('is_overdue', isOverdueFilter);
      if (deadlineFrom) params.append('deadline_from', deadlineFrom);
      if (deadlineTo) params.append('deadline_to', deadlineTo);

      const response = await fetch(`${API_BASE_URL}/tickets/filtered?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.results || []);
        setTicketsTotal(data.total || 0);
        
        const initialEdits = (data.results || []).reduce((acc, t) => {
          acc[t.id] = { assignee_id: t.assignee_id || '', status: t.status };
          return acc;
        }, {});
        setEditStates(initialEdits);
      }
    } catch (error) { console.error("Ошибка загрузки:", error); } 
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      // Используем параметры состояния вместо жесткого лимита 100
      const res = await fetch(
        `${API_BASE_URL}/employee/?sorted_by=${empSortBy}&sorted_order=${empSortOrder}&limit=${empLimit}&offset=${empOffset}`
      );
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.results || []);
        setEmpTotal(data.total || 0);
      }
    } catch (e) { console.error(e); }
  };

  const fetchReports = async () => {
    try {
      const [resGen, resAss] = await Promise.all([
        fetch(`${API_BASE_URL}/stats/general`), 
        fetch(`${API_BASE_URL}/stats/assignees`)
      ]);
      if (resGen.ok) setGeneralStats(await resGen.json());
      if (resAss.ok) setAssigneeStats((await resAss.json()).results || []);
    } catch (e) { console.error(e); }
  };

  // Эффекты загрузки (автоматически обновляют данные при изменении параметров)
  useEffect(() => {
    if (activeTab === 'tickets') fetchTickets();
    else if (activeTab === 'employees') fetchEmployees();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab, ticketPage, ticketSortBy, ticketSortOrder, statusFilter, assigneeFilter, departmentFilter, isOverdueFilter, deadlineFrom, deadlineTo, empSortBy, empSortOrder, empOffset]);

  // Загрузка начальных данных при монтировании компонента
  useEffect(() => {
    fetchTickets();
    fetchEmployees();
    fetchReports();
  }, []);
  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newDescription || !newDeadline || !newAuthorId) {
      setCreateError('Пожалуйста, заполните все поля!');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: parseInt(newAuthorId, 10),
          description: newDescription,
          deadline: new Date(newDeadline).toISOString(), 
          status: 'NEW'
        }),
      });
      if (response.ok) {
        setNewDescription('');
        setNewDeadline('');
        setNewAuthorId('');
        fetchTickets();
        alert('Заявка успешно создана!');
      } else {
        const errData = await response.json();
        setCreateError(errData.detail || 'Ошибка при создании заявки');
      }
    } catch (err) { setCreateError('Не удалось связаться с сервером'); }
  };

  const handleUpdateTicket = async (ticketId, originalTicket) => {
    const editData = editStates[ticketId];
    if (!editData) return;
    try {
      if (editData.status !== originalTicket.status) {
        const resStatus = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: editData.status }),
        });
        if (!resStatus.ok) {
          const err = await resStatus.json();
          alert(`Ошибка изменения статуса: ${err.detail || 'Ошибка'}`);
          fetchTickets();
          return;
        }
      }
      const origAssignee = originalTicket.assignee_id || '';
      if (editData.assignee_id !== origAssignee) {
        const resAssignee = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assignee`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignee_id: editData.assignee_id ? parseInt(editData.assignee_id, 10) : null
          }),
        });
        if (!resAssignee.ok) {
          const err = await resAssignee.json();
          alert(`Ошибка исполнителя: ${err.detail || 'Ошибка'}`);
          fetchTickets();
          return;
        }
      }
      alert(`Заявка №${ticketId} обновлена успешно!`);
      fetchTickets();
    } catch (err) { alert('Ошибка соединения с сервером'); }
  };

  const handleLocalEditChange = (ticketId, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [ticketId]: { ...prev[ticketId], [field]: value }
    }));
  };

  return (
    <div className="container">
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>🎟️ Заявки ({ticketsTotal})</button>
        <button className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>👥 Сотрудники ({empTotal})</button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>📊 Аналитика и Отчёты</button>
      </div>

      {loading && <div className="global-loader">Обновление данных...</div>}

      {/* ВКЛАДКА 1: ЗАЯВКИ */}
      {activeTab === 'tickets' && (
        <>
          <div className="card create-card">
            <h3>➕ Создать новую заявку</h3>
            <form onSubmit={handleCreateTicket} className="create-form">
              <input
                type="text"
                placeholder="Что случилось? (Описание)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                maxLength={1000}
              />
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
              <input
                type="number"
                placeholder="ID автора"
                value={newAuthorId}
                onChange={(e) => setNewAuthorId(e.target.value)}
              />
              <button type="submit" className="btn btn-success">Создать</button>
            </form>
            {createError && <p className="error-text">{createError}</p>}
          </div>

          <div className="toolbar">
            <div className="filter-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Все статусы</option>
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              <input
                type="number"
                placeholder="ID Исполнителя"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              />

              <input
                type="number"
                placeholder="ID Подразделения"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              />

              <select value={isOverdueFilter} onChange={(e) => setIsOverdueFilter(e.target.value)}>
                <option value="">Просрочка: Все</option>
                <option value="true">Только просроченные</option>
                <option value="false">В дедлайне</option>
              </select>

              <div className="date-filter">
                <label>С: </label>
                <input
                  type="date"
                  value={deadlineFrom}
                  onChange={(e) => setDeadlineFrom(e.target.value)}
                />
                <label> По: </label>
                <input
                  type="date"
                  value={deadlineTo}
                  onChange={(e) => setDeadlineTo(e.target.value)}
                />
              </div>
            </div>

            <div className="sort-box">
              <label>Сортировка: </label>
              <select value={ticketSortBy} onChange={(e) => setTicketSortBy(e.target.value)}>
                <option value="id">ID (Номер)</option>
                <option value="deadline">Срок выполнения</option>
                <option value="created_at">Дата создания</option>
              </select>
              <select value={ticketSortOrder} onChange={(e) => setTicketSortOrder(e.target.value)}>
                <option value="asc">По возрастанию</option>
                <option value="desc">По убыванию</option>
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Дата создания</th>
                <th>Описание</th>
                <th>Срок выполнения</th>
                <th>Статус</th>
                <th>Автор ID</th>
                <th>Исполнитель (ID)</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">Заявки не найдены</td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const currentEdit = editStates[ticket.id] || { assignee_id: '', status: 'NEW' };
                  return (
                    <tr key={ticket.id}>
                      <td>{ticket.id}</td>
                      <td>{new Date(ticket.created_at).toLocaleString('ru-RU')}</td>
                      <td>{ticket.description}</td>
                      <td>{new Date(ticket.deadline).toLocaleString('ru-RU')}</td>
                      <td>
                        <select
                          value={currentEdit.status}
                          onChange={(e) => handleLocalEditChange(ticket.id, 'status', e.target.value)}
                          className={`status-select ${currentEdit.status}`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </td>
                      <td>{ticket.author_id}</td>
                      <td>
                        <input
                          type="number"
                          placeholder="ID"
                          value={currentEdit.assignee_id}
                          onChange={(e) => handleLocalEditChange(ticket.id, 'assignee_id', e.target.value)}
                          className="assignee-input"
                        />
                      </td>
                      <td>
                        <button 
                          onClick={() => handleUpdateTicket(ticket.id, ticket)}
                          className="btn btn-save"
                        >
                          Сохранить
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* БЛОК СТРАНИЦ / ПАГИНАЦИИ */}
          <div className="pagination">
            <button 
              className="btn btn-pag" 
              onClick={() => setTicketPage(prev => Math.max(prev - 1, 1))}
              disabled={ticketPage === 1}
            >
              ⬅ Назад
            </button>
            
            <span className="page-info">
              Страница {ticketPage} из {totalPages}
            </span>

            {/* БЫСТРЫЙ ПЕРЕХОД */}
            <div className="quick-jump">
              <input
                type="number"
                min="1"
                max={totalPages}
                placeholder="Стр..."
                className="jump-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1 && val <= totalPages) {
                      setTicketPage(val);
                      e.target.value = ''; // очищаем поле после перехода
                    } else {
                      alert(`Введите страницу от 1 до ${totalPages}`);
                    }
                  }
                }}
              />
              <button 
                className="btn btn-jump"
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  const val = parseInt(input.value, 10);
                  if (val >= 1 && val <= totalPages) {
                    setTicketPage(val);
                    input.value = '';
                  } else {
                    alert(`Введите страницу от 1 до ${totalPages}`);
                  }
                }}
              >
                ОК
              </button>
            </div>

            <button 
              className="btn btn-pag" 
              onClick={() => setTicketPage(prev => Math.min(prev + 1, totalPages))}
              disabled={ticketPage >= totalPages}
            >
              Вперед ➡
            </button>
          </div>
        </>
      )}

      {/* ВКЛАДКА 2: СОТРУДНИКИ */}
      {activeTab === 'employees' && (
        <>
          <div className="toolbar">
            <div className="sort-box">
              <label>Сортировать персонал по: </label>
              <select value={empSortBy} onChange={(e) => setEmpSortBy(e.target.value)}>
                <option value="id">ID</option>
                <option value="fullname">ФИО</option>
                <option value="role">Должность</option>
                <option value="department_name">Подразделение</option>
              </select>
              <select value={empSortOrder} onChange={(e) => setEmpSortOrder(e.target.value)}>
                <option value="asc">По возрастанию</option>
                <option value="desc">По убыванию</option>
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Должность</th>
                <th>Подразделение</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">Сотрудники не найдены</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td><strong>{emp.fullname}</strong></td>
                    <td>{emp.role}</td>
                    <td><span className="dept-tag">{emp.department_name}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button 
              className="btn btn-pag"
              disabled={empOffset === 0} 
              onClick={() => setEmpOffset(prev => Math.max(0, prev - empLimit))}
            >
              ⬅ Назад
            </button>

            <span className="page-info">
              Страница {Math.floor(empOffset / empLimit) + 1} из {Math.ceil(empTotal / empLimit) || 1}
            </span>

            {/* БЫСТРЫЙ ПЕРЕХОД ДЛЯ СОТРУДНИКОВ */}
            <div className="quick-jump">
              <input
                type="number"
                placeholder="Стр..."
                className="jump-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(e.target.value, 10);
                    const maxPage = Math.ceil(empTotal / empLimit);
                    if (page >= 1 && page <= maxPage) {
                      setEmpOffset((page - 1) * empLimit);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <button 
                className="btn btn-jump"
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  const page = parseInt(input.value, 10);
                  const maxPage = Math.ceil(empTotal / empLimit);
                  if (page >= 1 && page <= maxPage) {
                    setEmpOffset((page - 1) * empLimit);
                    input.value = '';
                  }
                }}
              >
                ОК
              </button>
            </div>

            <button 
              className="btn btn-pag"
              disabled={empOffset + empLimit >= empTotal} 
              onClick={() => setEmpOffset(prev => prev + empLimit)}
            >
              Вперед ➡
            </button>
          </div>

          
        </>
      )}

      {/* ВКЛАДКА 3: ОТЧЁТНОСТЬ */}
      {activeTab === 'reports' && (
        <div className="reports-grid">
          <div className="card stat-card overdue">
            <h4>🚨 Просрочено заявок в системе всего:</h4>
            <div className="huge-number">{generalStats?.overdue_count || 0}</div>
          </div>

          <div className="card">
            <h4>📊 Заявки по статусам</h4>
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
            <h4>🏆 Эффективность (Количество выполненных заявок по исполнителям)</h4>
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
                  <tr>
                    <td colSpan="3" className="no-data">Пока никто не закрыл ни одной заявки</td>
                  </tr>
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
      )}
    </div>
  );
}

export default App;
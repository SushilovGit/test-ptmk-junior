import { useState, useEffect } from 'react';
import Pagination from '../Pagination'; 

export default function Tickets({ API_BASE_URL, onTotalChange, setLoading }) {
  const [tickets, setTickets] = useState([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketPage, setTicketPage] = useState(1);
  const ticketLimit = 10;

  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isOverdueFilter, setIsOverdueFilter] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
  
  const [ticketSortBy, setTicketSortBy] = useState('deadline');
  const [ticketSortOrder, setTicketSortOrder] = useState('asc');

  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAuthorId, setNewAuthorId] = useState('');
  const [createError, setCreateError] = useState('');
  const [editStates, setEditStates] = useState({});

  const totalPages = Math.ceil(ticketsTotal / ticketLimit) || 1;

  // Обновляем общий счетчик в App.jsx при изменении
  useEffect(() => {
    onTotalChange(ticketsTotal);
  }, [ticketsTotal, onTotalChange]);

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setTicketPage(1);
  }, [statusFilter, assigneeFilter, departmentFilter, isOverdueFilter, deadlineFrom, deadlineTo]);

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
    } catch (error) { 
      console.error("Ошибка загрузки:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketPage, ticketSortBy, ticketSortOrder, statusFilter, assigneeFilter, departmentFilter, isOverdueFilter, deadlineFrom, deadlineTo]);

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
    } catch (err) { 
      setCreateError('Не удалось связаться с сервером'); 
    }
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
    } catch (err) { 
      alert('Ошибка соединения с сервером'); 
    }
  };

  const handleLocalEditChange = (ticketId, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [ticketId]: { ...prev[ticketId], [field]: value }
    }));
  };

  return (
    <>
      <div className="card create-card">
        <h3>Создать новую заявку</h3>
        <form onSubmit={handleCreateTicket} className="create-form">
          <input type="text" placeholder="Что случилось? (Описание)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} maxLength={1000} />
          <input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
          <input type="number" placeholder="ID автора" value={newAuthorId} onChange={(e) => setNewAuthorId(e.target.value)} />
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
          <input type="number" placeholder="ID Исполнителя" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} />
          <input type="number" placeholder="ID Подразделения" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} />
          <select value={isOverdueFilter} onChange={(e) => setIsOverdueFilter(e.target.value)}>
            <option value="">Просрочка: Все</option>
            <option value="true">Только просроченные</option>
            <option value="false">В дедлайне</option>
          </select>
          <div className="date-filter">
            <label>С: </label>
            <input type="date" value={deadlineFrom} onChange={(e) => setDeadlineFrom(e.target.value)} />
            <label> По: </label>
            <input type="date" value={deadlineTo} onChange={(e) => setDeadlineTo(e.target.value)} />
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
            <th>Номер</th><th>Дата создания</th><th>Описание</th><th>Срок выполнения</th>
            <th>Статус</th><th>Автор ID</th><th>Исполнитель (ID)</th><th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr><td colSpan="8" className="no-data">Заявки не найдены</td></tr>
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
                    <select value={currentEdit.status} onChange={(e) => handleLocalEditChange(ticket.id, 'status', e.target.value)} className={`status-select ${currentEdit.status}`}>
                      <option value="NEW">NEW</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                  <td>{ticket.author_id}</td>
                  <td>
                    <input type="number" placeholder="ID" value={currentEdit.assignee_id} onChange={(e) => handleLocalEditChange(ticket.id, 'assignee_id', e.target.value)} className="assignee-input" />
                  </td>
                  <td>
                    <button onClick={() => handleUpdateTicket(ticket.id, ticket)} className="btn btn-save">Сохранить</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <Pagination 
        currentPage={ticketPage} 
        totalPages={totalPages} 
        onPageChange={setTicketPage} 
      />
    </>
  );
}
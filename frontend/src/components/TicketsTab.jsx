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
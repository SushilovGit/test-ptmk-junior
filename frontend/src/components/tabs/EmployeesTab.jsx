import { useState, useEffect } from 'react';
import Pagination from '../Pagination'; // <-- Импортируем компонент

export default function Employees({ API_BASE_URL, onTotalChange, setLoading }) {
  const [employees, setEmployees] = useState([]);
  const [empTotal, setEmpTotal] = useState(0);
  const [empSortBy, setEmpSortBy] = useState('id');
  const [empSortOrder, setEmpSortOrder] = useState('asc');
  const [empOffset, setEmpOffset] = useState(0);
  const [empLimit] = useState(24);

  useEffect(() => {
    onTotalChange(empTotal);
  }, [empTotal, onTotalChange]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/employee/?sorted_by=${empSortBy}&sorted_order=${empSortOrder}&limit=${empLimit}&offset=${empOffset}`
      );
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.results || []);
        setEmpTotal(data.total || 0);
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empSortBy, empSortOrder, empOffset]);

  // --- АДАПТАЦИЯ ДЛЯ PAGINATION ---
  // Вычисляем номер текущей страницы и общее число страниц для UI
  const currentEmpPage = Math.floor(empOffset / empLimit) + 1;
  const totalEmpPages = Math.ceil(empTotal / empLimit) || 1;

  // Функция, которую мы передадим в Pagination. 
  // Она получает номер страницы и переводит его в offset
  const handleEmpPageChange = (newPage) => {
    setEmpOffset((newPage - 1) * empLimit);
  };

  return (
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
            <tr><td colSpan="4" className="no-data">Сотрудники не найдены</td></tr>
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

      <Pagination 
        currentPage={currentEmpPage} 
        totalPages={totalEmpPages} 
        onPageChange={handleEmpPageChange} 
      />
    </>
  );
}
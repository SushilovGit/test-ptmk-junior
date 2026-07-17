import { useState } from 'react';
import './App.css';
import Tickets from './components/tabs/TicketsTab';
import Employees from './components/tabs/EmployeesTab';
import Reports from './components/tabs/ReportsTab';

const API_BASE_URL = `http://${window.location.hostname}:8000`;

function App() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(false);
  
  // Состояния только для отображения общих счетчиков в заголовках вкладок
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [empTotal, setEmpTotal] = useState(0);

  return (
    <div className="container">
      <h1></h1>
      
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tickets')}
        >
          Заявки ({ticketsTotal})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} 
          onClick={() => setActiveTab('employees')}
        >
          Сотрудники ({empTotal})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          Аналитика
        </button>
      </div>

      {loading && <div className="global-loader">Обновление данных...</div>}

      {/* Условный рендеринг компонентов. Они монтируются только при активации вкладки, 
          что автоматически запускает их внутренние useEffect для загрузки данных */}
      {activeTab === 'tickets' && (
        <Tickets 
          API_BASE_URL={API_BASE_URL} 
          onTotalChange={setTicketsTotal} 
          setLoading={setLoading} 
        />
      )}

      {activeTab === 'employees' && (
        <Employees 
          API_BASE_URL={API_BASE_URL} 
          onTotalChange={setEmpTotal} 
          setLoading={setLoading} 
        />
      )}

      {activeTab === 'reports' && (
        <Reports 
          API_BASE_URL={API_BASE_URL} 
          setLoading={setLoading} 
        />
      )}
    </div>
  );
}

export default App;
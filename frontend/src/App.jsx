import { useState } from 'react';
import './App.css';
import Tickets from './components/tabs/TicketsTab';
import Employees from './components/tabs/EmployeesTab';
import Reports from './components/tabs/ReportsTab';

const API_BASE_URL = `http://${window.location.hostname}:8000`;

function App() {
  const [activeTab, setActiveTab] = useState('tickets');

  return (
    <div className="container">
      
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tickets')}
        >
          Заявки 
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} 
          onClick={() => setActiveTab('employees')}
        >
          Сотрудники
          {/* Сотрудники ({empTotal}) */}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          Аналитика
        </button>
      </div>

      {activeTab === 'tickets' && (
        <Tickets 
          API_BASE_URL={API_BASE_URL} 
        />
      )}

      {activeTab === 'employees' && (
        <Employees 
          API_BASE_URL={API_BASE_URL} 
        />
      )}

      {activeTab === 'reports' && (
        <Reports 
          API_BASE_URL={API_BASE_URL} 
        />
      )}
    </div>
  );
}

export default App;
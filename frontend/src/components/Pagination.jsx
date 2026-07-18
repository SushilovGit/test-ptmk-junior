import { useState } from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  const handleJump = () => {
    const val = parseInt(jumpValue, 10);

    if (val >= 1 && val <= totalPages) {
      onPageChange(val);
      setJumpValue('');
    } else {
      alert(`Введите страницу от 1 до ${totalPages}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleJump();
    }
  };

  return (
    <div className="pagination">
      <button
        className="btn btn-pag"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Назад
      </button>

      <span className="page-info">
        Страница {currentPage} из {totalPages}
      </span>

      <div className="quick-jump">
        <input
          type="number"
          min="1"
          max={totalPages}
          placeholder="Стр..."
          className="jump-input"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-jump" onClick={handleJump}>
          ОК
        </button>
      </div>

      <button
        className="btn btn-pag"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Вперед
      </button>
    </div>
  );
}
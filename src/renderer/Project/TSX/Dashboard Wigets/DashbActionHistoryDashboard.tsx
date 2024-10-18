import React, { useState, useEffect } from 'react';
import { getValuesWithSql } from 'Backend/localServerApis';
import { format } from 'date-fns';

interface ActionHistoryItem {
  id: string;
  action_table: string;
  action_type: string;
  description: string;
  performed_by: string;
  action_date: number;
  userId: string;
}

const DashbActionHistoryDashboard: React.FC = () => {
  const [history, setHistory] = useState<ActionHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ActionHistoryItem[]>(
    []
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ActionHistoryItem;
    direction: 'asc' | 'desc';
  }>({ key: 'action_date', direction: 'desc' });
  const [filters, setFilters] = useState({
    action_table: '',
    action_type: '',
    description: '',
    performed_by: '',
    action_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isValidDate, setIsValidDate] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const fetchActionHistory = async () => {
      try {
        const result = await getValuesWithSql(
          'action_history',
          'ORDER BY action_date DESC'
        );
        setHistory(result);
        setFilteredHistory(result.slice(0, limit));
      } catch (error) {
        console.error('Failed to fetch action history:', error);
      }
    };

    fetchActionHistory();
    const intervalId = setInterval(fetchActionHistory, 60000);
    return () => clearInterval(intervalId);
  }, [limit]);

  useEffect(() => {
    let result = history;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'action_date') {
          const filterDate = new Date(value);
          result = result.filter((item) => {
            const itemDate = new Date(item.action_date);
            if (dateRange === 'month') {
              return (
                itemDate.getFullYear() === filterDate.getFullYear() &&
                itemDate.getMonth() === filterDate.getMonth()
              );
            } else {
              return itemDate.getFullYear() === filterDate.getFullYear();
            }
          });
        } else {
          result = result.filter((item) =>
            String(item[key as keyof ActionHistoryItem])
              .toLowerCase()
              .includes(value.toLowerCase())
          );
        }
      }
    });
    setFilteredHistory(result.slice(0, limit));
  }, [filters, history, dateRange, limit]);

  const handleSort = (key: keyof ActionHistoryItem) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));

    setFilteredHistory((prevHistory) =>
      [...prevHistory].sort((a, b) => {
        if (key === 'action_date') {
          return sortConfig.direction === 'asc'
            ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
            : new Date(b[key]).getTime() - new Date(a[key]).getTime();
        }
        if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }).slice(0, limit)
    );
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      action_table: '',
      action_type: '',
      description: '',
      performed_by: '',
      action_date: '',
    });
    setSortConfig({ key: 'action_date', direction: 'desc' });
    setSelectedDate('');
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value as 'month' | 'year');
    setSelectedDate('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setIsValidDate(true);
  };

  const handleFindClick = () => {
    if (dateRange === 'month') {
      const dateRegex = /^\d{4}-\d{2}$/;
      if (!dateRegex.test(selectedDate)) {
        setIsValidDate(false);
        return;
      }
    } else {
      const yearRegex = /^\d{4}$/;
      if (!yearRegex.test(selectedDate)) {
        setIsValidDate(false);
        return;
      }
    }
    setIsValidDate(true);
    setFilters((prevFilters) => ({
      ...prevFilters,
      action_date: selectedDate,
    }));
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
  };

  return (
    <div
      style={{
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        borderRadius: '15px',
        transition: 'all 0.3s ease',
      }}
    >
      <h2
        style={{
          marginBottom: '24px',
          width: '100%',
          fontSize: '28px',
          color: 'var(--Text-Color)',
          borderBottom: '2px solid var(--Secondary-Color)',
          paddingBottom: '10px',
        }}
      >
        Action History{' '}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--Secondary-Color)',
            color: 'var(--Text-Color)',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        {showFilters && (
          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--Accent-Color)',
                color: 'var(--Text-Color)',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '15px',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        {showFilters && (
          <>
            <span style={{ color: 'var(--Text-Color)', fontWeight: 'bold' }}>
              Filter specific date:
            </span>
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid var(--Secondary-Color)',
              }}
            >
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <input
              type={dateRange === 'month' ? 'month' : 'number'}
              value={selectedDate}
              onChange={handleDateChange}
              placeholder={dateRange === 'month' ? 'YYYY-MM' : 'YYYY'}
              style={{
                padding: '8px',
                borderRadius: '5px',
                border: `1px solid ${
                  isValidDate ? 'var(--Secondary-Color)' : 'red'
                }`,
                width: dateRange === 'month' ? '150px' : '80px',
              }}
            />
            <button
              onClick={handleFindClick}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--Accent-Color)',
                color: 'var(--Text-Color)',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Find
            </button>
          </>
        )}
        {!isValidDate && (
          <span style={{ color: 'red', fontStyle: 'italic' }}>
            Invalid date format
          </span>
        )}
        <span style={{ color: 'var(--Text-Color)', fontWeight: 'bold' }}>
          Show:
        </span>
        <select
          value={limit}
          onChange={handleLimitChange}
          style={{
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid var(--Secondary-Color)',
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 10px',
          }}
        >
          <thead>
            <tr>
              {[
                'Action Table',
                'Action Type',
                'Description',
                'Performed By',
                'Date',
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: '5px',
                    textAlign: 'left',
                    borderBottom: '2px solid var(--Secondary-Color)',
                    color: 'var(--Text-Color)',
                    fontWeight: 'bold',
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    {header}{' '}
                    {header !== 'Date' && showFilters && (
                      <button
                        onClick={() =>
                          handleSort(
                            header
                              .toLowerCase()
                              .replace(' ', '_') as keyof ActionHistoryItem
                          )
                        }
                        style={{
                          cursor: 'pointer',
                          marginLeft: '5px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--Accent-Color)',
                        }}
                      >
                        Sort{' '}
                        {sortConfig.key ===
                          header.toLowerCase().replace(' ', '_') &&
                          (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </button>
                    )}
                  </div>

                  {showFilters && header !== 'Date' && (
                    <input
                      type="text"
                      name={header.toLowerCase().replace(' ', '_')}
                      placeholder={`Filter ${header}`}
                      value={
                        filters[
                          header
                            .toLowerCase()
                            .replace(' ', '_') as keyof typeof filters
                        ]
                      }
                      onChange={handleFilterChange}
                      style={{
                        width: '150px',
                        padding: '8px',
                        borderRadius: '5px',
                        border: '1px solid var(--Secondary-Color)',
                        backgroundColor: 'var(--Secondary-Color)',
                        color: 'var(--Text-Color)',minWidth: '90px'
                      }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item, index) => (
                <tr
                  key={`${item.id}-${index}`}
                  style={{
                    background: 'var(--Secondary-Color60)',
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <td
                    style={{
                      padding: '5px',
                      borderRadius: '10px 0px 0px 10px',
                      fontSize: '14px',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.action_table}
                  </td>
                  <td
                    style={{
                      padding: '5px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.action_type}
                  </td>
                  <td
                    style={{
                      padding: '5px',
                      fontSize: '14px',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      padding: '5px',
                      fontSize: '14px',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.performed_by}
                  </td>
                  <td
                    style={{
                      padding: '5px',
                      borderRadius: '0px 10px 10px 0px',
                      fontSize: '14px',
                      color: 'var(--Text-Color)',
                      textAlign: 'right',
                    }}
                  >
                    {format(new Date(item.action_date), 'MMM dd, yyyy')}
                    <br />
                    {format(new Date(item.action_date), 'HH:mm:ss')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: 'center',
                    padding: '30px',
                    color: 'var(--Text-Color)',
                    fontSize: '16px',
                    fontStyle: 'italic',
                  }}
                >
                  There are currently no action history items to display. Please
                  adjust your filters or perform new actions to see them here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashbActionHistoryDashboard;

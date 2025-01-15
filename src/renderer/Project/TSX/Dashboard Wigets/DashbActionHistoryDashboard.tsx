import React, { useState, useEffect } from 'react';
import { getValuesWithSql } from 'Backend/localServerApis';
import { format } from 'date-fns';
import { Input } from '../Helpers/CustomReactComponents';
import loadingGif from "./../../../assets/assets/Loading/Rolling-1s-200px.gif"
import { useGlobal } from 'renderer/components/GlobalContext';
import { storageManager } from 'renderer/storeManager';

interface ActionHistoryItem {
  id: string;
  action_table: string;
  action_type: string;
  description: string;
  performed_by: string;
  action_date: number;
  userId: string;
}

const DashbActionHistoryDashboard: React.FC = ({ SelectedBranchId }: any) => {
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchActionHistory = async () => {
      setIsLoading(true);
      try {
     if(window.location.href.includes('tryout')) {
      const result = storageManager.get("action_history").sort((a: ActionHistoryItem, b: ActionHistoryItem) => {
        return b.action_date - a.action_date;
      });
      setHistory(result);
      setFilteredHistory(result.slice(0, limit));
      setIsLoading(false);
     } else 
     {
       const result = await getValuesWithSql(
          'action_history',
          `WHERE branchId = '${SelectedBranchId}' ORDER BY action_date DESC`
        );
        setHistory(result);
        setFilteredHistory(result.slice(0, limit));
        setIsLoading(false);
     }  
      } catch (error) {
        console.error('Failed to fetch action history:', error);
        setIsLoading(false);
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
      [...prevHistory]
        .sort((a, b) => {
          if (key === 'action_date') {
            return sortConfig.direction === 'asc'
              ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
              : new Date(b[key]).getTime() - new Date(a[key]).getTime();
          }
          if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        })
        .slice(0, limit)
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
  const { isMobileState } = useGlobal();
  return (
    <div
      style={{
        padding: isMobileState ? 'var(--5px-V)' : 'var(--30px-V)',
        marginBottom: 'var(--30px-V)',
        boxShadow: '0 var(--10px-V) var(--30px-V) rgba(0, 0, 0, 0.1)',
        borderRadius: 'var(--15px-V)',
        transition: 'all 0.3s ease',
        position: 'relative',
        height: '100%',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: 'var(--15px-V)',
          }}
        >
          <img src={loadingGif} alt="Loading..." style={{width:'100px',height:'100px'}}/>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--24px-V)',
        borderBottom: 'var(--2px-V) solid var(--Secondary-Color)',
        paddingBottom: 'var(--10px-V)',
      }}>
        <h2 style={{
          fontSize: 'var(--28px-V)',
          color: 'var(--Text-Color)',
          margin: 0,
        }}>
          Action History  <span style={{ fontSize: 'var(--20px-V)' }}>of {format(new Date(), 'MMM yyyy')}</span>
        </h2>
        
        <div style={{display: 'flex', gap: 'var(--10px-V)'}}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: 'var(--8px-V) var(--16px-V)',
              backgroundColor: 'var(--Secondary-Color)',
              color: 'var(--Text-Color)',
              border: 'none',
              borderRadius: 'var(--5px-V)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: 'bold',
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: 'var(--8px-V) var(--16px-V)',
                backgroundColor: 'var(--Accent-Color)',
                color: 'var(--Text-Color)',
                border: 'none',
                borderRadius: 'var(--5px-V)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 'bold',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div style={{
          padding: 'var(--15px-V)',
          borderRadius: 'var(--10px-V)',
          marginBottom: 'var(--20px-V)',
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--15px-V)',
            alignItems: 'center',
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--10px-V)'}}>
              <span style={{color: 'var(--Text-Color)', fontWeight: 'bold'}}>
                Filter by:
              </span>
              <select
                value={dateRange}
                onChange={handleDateRangeChange}
                style={{
                  padding: 'var(--8px-V)',
                  borderRadius: 'var(--5px-V)',
                  border: 'var(--1px-V) solid var(--Secondary-Color)',
                  color: 'var(--Text-Color)',
                  cursor: 'pointer',
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
                  padding: 'var(--8px-V)',
                  borderRadius: 'var(--5px-V)',
                  border: `var(--1px-V) solid ${isValidDate ? 'var(--Secondary-Color)' : 'red'}`,
                  width: dateRange === 'month' ? 'var(--150px-V)' : 'var(--80px-V)',
                  color: 'var(--Text-Color)',
                }}
              />
              <button
                onClick={handleFindClick}
                style={{
                  padding: 'var(--8px-V) var(--16px-V)',
                  backgroundColor: 'var(--Accent-Color)',
                  color: 'var(--Text-Color)',
                  border: 'none',
                  borderRadius: 'var(--5px-V)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                }}
              >
                Find
              </button>
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--10px-V)'}}>
              <span style={{color: 'var(--Text-Color)', fontWeight: 'bold'}}>
                Show:
              </span>
              <select
                value={limit}
                onChange={handleLimitChange}
                style={{
                  padding: 'var(--8px-V)',
                  borderRadius: 'var(--5px-V)',
                  border: 'var(--1px-V) solid var(--Secondary-Color)',
                  color: 'var(--Text-Color)',
                  cursor: 'pointer',
                }}
              >
                <option value={25}>25 entries</option>
                <option value={50}>50 entries</option>
                <option value={100}>100 entries</option>
                <option value={500}>500 entries</option>
                <option value={1000}>1000 entries</option>
              </select>
            </div>
          </div>

          {!isValidDate && (
            <div style={{
              color: 'red',
              fontStyle: 'italic',
              marginTop: 'var(--10px-V)',
            }}>
              Invalid date format
            </div>
          )}
        </div>
      )}

      <div style={{
        overflowX: 'auto',
        borderRadius: 'var(--10px-V)',
      }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 var(--10px-V)',
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
                    padding: 'var(--15px-V) var(--5px-V)',
                    textAlign: 'left',
                    borderBottom: 'var(--2px-V) solid var(--Secondary-Color)',
                    color: 'var(--Text-Color)',
                    fontWeight: 'bold',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--5px-V)',
                    marginBottom: showFilters ? 'var(--10px-V)' : 0,
                  }}>
                    {header}
                    {header !== 'Date' && showFilters && (
                      <button
                        onClick={() => handleSort(header.toLowerCase().replace(' ', '_') as keyof ActionHistoryItem)}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          background: 'none',
                          color: 'var(--Text-Color)',
                          padding: 'var(--2px-V) var(--5px-V)',
                          borderRadius: 'var(--3px-V)',
                        }}
                      >
                        {sortConfig.key === header.toLowerCase().replace(' ', '_') 
                          ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                          : '↕'}
                      </button>
                    )}
                  </div>

                  {showFilters && header !== 'Date' && (
                    <input
                      type="text"
                      name={header.toLowerCase().replace(' ', '_')}
                      placeholder={`Filter ${header}`}
                      value={filters[header.toLowerCase().replace(' ', '_') as keyof typeof filters]}
                      onChange={handleFilterChange}
                      style={{
                        width: '70%',
                        padding: 'var(--8px-V)',
                        borderRadius: 'var(--5px-V)',
                        border: 'var(--1px-V) solid var(--Secondary-Color)',
                        color: 'var(--Text-Color)',
                        minWidth: 'var(--90px-V)',
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
                    borderRadius: 'var(--10px-V)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <td
                    style={{
                      padding: 'var(--5px-V)',
                      borderRadius:
                        'var(--10px-V) var(--0px-V) var(--0px-V) var(--10px-V)',
                      fontSize: 'var(--14px-V)',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.action_table}
                  </td>
                  <td
                    style={{
                      padding: 'var(--5px-V)',
                      fontSize: 'var(--16px-V)',
                      fontWeight: 'bold',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.action_type}
                  </td>
                  <td
                    style={{
                      padding: 'var(--5px-V)',
                      fontSize: 'var(--14px-V)',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      padding: 'var(--5px-V)',
                      fontSize: 'var(--14px-V)',
                      color: 'var(--Text-Color)',
                    }}
                  >
                    {item.performed_by}
                    <br></br>
                    <span
                      style={{
                        fontSize: 'var(--12px-V)',
                        color: 'var(--Text-Color-Grey)',
                      }}
                    >
                      {' '}
                      {item.userInfo}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: 'var(--5px-V)',
                      borderRadius:
                        'var(--0px-V) var(--10px-V) var(--10px-V) var(--0px-V)',
                      fontSize: 'var(--14px-V)',
                      color: 'var(--Text-Color)',
                      textAlign: 'right',
                    }}
                  >
                    {format(new Date(item.action_date), 'MMM dd, yyyy')}
                    <br />
                    {format(new Date(item.action_date), 'HH:mm')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: 'center',
                    padding: 'var(--30px-V)',
                    color: 'var(--Text-Color)',
                    fontSize: 'var(--16px-V)',
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

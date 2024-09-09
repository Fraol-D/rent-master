import {
  getValuesWithSql,
  updateValue,
  deleteValue,
} from 'Backend/localServerApis';
import React, { useEffect, useState } from 'react';

const DatabasePage = ({ setChangeMade }: any) => {
  const [Data, setData] = useState<any[]>([]);
  const [searchConfig, setSearchConfig] = useState({ key: '', query: '' });
  const [mainSearch, setMainSearch] = useState('');
  const [editCell, setEditCell] = useState<{
    rowIndex: number;
    key: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  const GetDataBaseData = async (TableName: string) => {
    try {
      const DataRaw = await getValuesWithSql(TableName, 'WHERE 1');
      console.log(DataRaw);
      setData(DataRaw);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log('An unknown error occurred');
      }
    }
  };

  useEffect(() => {
    GetDataBaseData('rooms');
  }, []);

  const [SelectedTable, setSelectedTable] = useState<
    | 'rooms'
    | 'room_specifications'
    | 'tenants'
    | 'room_pay_info'
    | 'PastTenantReview'
    | 'brokers'
    | 'brokersRecommendationList'
    | 'PastTenantsForRoom'
    | 'agreements'
  >('rooms');

  const validTables = [
    'rooms',
    'room_specifications',
    'tenants',
    'room_pay_info',
    'PastTenantReview',
    'brokers',
    'brokersRecommendationList',
    'PastTenantsForRoom',
    'agreements',
  ];

  const OnChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    GetDataBaseData(e.target.value);
    setSelectedTable(e.target.value as typeof SelectedTable);
  };

  const handleSearch = (key: string) => {
    setSearchConfig({ ...searchConfig, key });
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchConfig({ ...searchConfig, query: e.target.value });
  };

  const filteredData = (data: any[], key: string, query: string) => {
    return data.filter((item) =>
      String(item[key]).toLowerCase().includes(query.toLowerCase())
    );
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.filter(String).map((part, i) => {
          return regex.test(part) ? (
            <mark key={i}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </span>
    );
  };

  const handleCellDoubleClick = (
    rowIndex: number,
    key: string,
    value: string
  ) => {
    setEditCell({ rowIndex, key });
    setEditValue(String(value));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditSubmit = async () => {
    if (editCell) {
      try {
        await updateValue(
          SelectedTable,
          Data[editCell.rowIndex].id,
          editCell.key,
          editValue,
          setChangeMade
        );
        const updatedData = [...Data];
        updatedData[editCell.rowIndex] = {
          ...updatedData[editCell.rowIndex],
          [editCell.key]: editValue,
        };
        setData(updatedData);
        setEditCell(null);
      } catch (error) {
        console.error('Failed to update value:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteValue(SelectedTable, id);
      const updatedData = Data.filter((item) => item.id !== id);
      setData(updatedData);
    } catch (error) {
      console.error('Failed to delete value:', error);
    }
  };

  return (
    <div className="CalenderContainer">
      <div
        className="CalanderMainContainer"
        style={{
          height: 'calc(100% - 30px)',
        }}
      >
        <div className="CalenderOptionsMainContainer">
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            Warning: Modifying database values without proper understanding can
            lead to critical system errors. Only edit if you are certain of the
            consequences.
          </span>
          <label htmlFor="monthsFutureInput">Select a table: </label>
          <select
            value={SelectedTable}
            onChange={OnChangeSelect}
            style={{ height: '30px' }}
          >
            {validTables.map((val, index) => (
              <option key={index} value={val}>
                {val}
              </option>
            ))}
          </select>
          <label htmlFor="monthsFutureInput">Search all fields: </label>
          <input
            type="text"
            style={{
              padding: '5px',
              borderRadius: '3px',
              border: '1px solid rgb(204, 204, 204)',
            }}
            value={mainSearch}
            onChange={(e) => setMainSearch(e.target.value)}
            placeholder="Main search"
          />
        </div>
        <div
          style={{
            overflowX: 'auto',
            height: 'calc(100% - 55px)',
            marginTop: '5px',
          }}
        >
          <table className="table-container">
            <thead className="table-header">
              <tr>
                {Data.length > 0 &&
                  Object.keys(Data[0]).map((header, index) => (
                    <th key={index} onClick={() => handleSearch(header)}>
                      {searchConfig.key === header ? (
                        <input
                          type="text"
                          value={searchConfig.query}
                          onChange={handleQueryChange}
                          placeholder={`Search ${header}`}
                          autoFocus
                        />
                      ) : (
                        header
                      )}
                    </th>
                  ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredData(Data, searchConfig.key, searchConfig.query).map(
                (row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.entries(row).map(([key, value], cellIndex) => (
                      <td
                        key={cellIndex}
                        onDoubleClick={() =>
                          handleCellDoubleClick(rowIndex, key, String(value))
                        }
                      >
                        {editCell &&
                        editCell.rowIndex === rowIndex &&
                        editCell.key === key ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={handleEditChange}
                            onBlur={handleEditSubmit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditSubmit();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          highlightText(String(value), mainSearch)
                        )}
                      </td>
                    ))}
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DatabasePage;

import {
  getValuesWithSql,
  updateValue,
  deleteValue,
} from 'Backend/localServerApis';
import React, { useEffect, useMemo, useState } from 'react';
import { getUserPrivileges } from 'renderer/App';

const DatabasePage = ({ setChangeMade,SelectedAppUser }: any) => {
  const [Data, setData] = useState<any[]>([]);
  const [searchConfig, setSearchConfig] = useState({ key: '', query: '' });
  const [mainSearch, setMainSearch] = useState('');
  const [editCell, setEditCell] = useState<{
    rowIndex: number;
    key: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const privileges = useMemo(() => getUserPrivileges(SelectedAppUser), [SelectedAppUser]);
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
    | 'notification_template_selections'
    | 'email_templates'
    | 'utility_payments'
    | 'utility_payments_settings'
    | 'sms_templates'
    | 'expenses'
    | 'room_pay_info_history'

  >('rooms');

  const validTables = [
    'rooms',
    'room_specifications',
    'tenants',
    'room_pay_info',
    'room_pay_info_history',
    'PastTenantReview',
    'brokers',
    'brokersRecommendationList',
    'PastTenantsForRoom',
    'agreements',
    'notification_template_selections',
    'email_templates',
    'utility_payments',
    'utility_payments_settings',
    'sms_templates',
    'expenses',
   
  ];

  const OnChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    GetDataBaseData(e.target.value);
    setSelectedTable(e.target.value as typeof SelectedTable);
    setHighlightedRow(null);
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
          setChangeMade,
          Data[editCell.rowIndex][editCell.key]
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
      await deleteValue(SelectedTable, id,setChangeMade);
      const updatedData = Data.filter((item) => item.id !== id);
      setData(updatedData);
    } catch (error) {
      console.error('Failed to delete value:', error);
    }
  };

  const handleGoTo = async (key: string, value: string) => {
    let targetTable = '';
    switch (key) {
      case 'roomId':
        targetTable = 'rooms';
        break;
      case 'tenantId':
        targetTable = 'tenants';
        break;
      case 'brokerId':
        targetTable = 'brokers';
        break;
      case 'agreementId':
        targetTable = 'agreements';
        break;
      
      case 'email_template_id':
        targetTable = 'email_templates';
        break;
      case 'selectedAgreementId':
        targetTable = 'agreements';
        break;
      default:
        console.log('No matching table found for this ID');
        return;
    }

    await GetDataBaseData(targetTable);
    setSelectedTable(targetTable as typeof SelectedTable);
    setHighlightedRow(value);
    // Update the select element to reflect the new table
    const selectElement = document.querySelector('select') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = targetTable;
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
          <span style={{ color: 'pink', fontWeight: 'bold' }}>
            Warning: Modifying database values can cause critical errors. Edit only if certain.
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
                  <tr key={rowIndex} style={row.id === highlightedRow ? {backgroundColor: 'var(--Accent-Color50)'} : {}}>
                    {Object.entries(row).map(([key, value], cellIndex) => (
                      <td
                        key={cellIndex}
                        onDoubleClick={() =>
                          {if(privileges.editDatabaseData){handleCellDoubleClick(rowIndex, key, String(value));}}
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
                          <>
                            {highlightText(String(value), mainSearch)}
                            {['roomId', 'tenantId', 'brokerId', 'agreementId', 'email_template_id', 'selectedAgreementId'].includes(key) && value && (
                              <button
                                onClick={() => handleGoTo(key, String(value))}
                                style={{ marginLeft: '5px' }}
                              >
                                Go to
                              </button>
                            )}
                          </>
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
export default React.memo(DatabasePage);

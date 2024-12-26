import { Input } from '../Helpers/CustomReactComponents';
import {
  getValuesWithSql,
  updateValue,
  deleteValue,
} from 'Backend/localServerApis';
import React, { useEffect, useMemo, useState } from 'react';
import { getUserPrivileges } from 'renderer/App';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import { useGlobal } from 'renderer/components/GlobalContext';
const DatabasePage = ({
  setChangeMade,
  SelectedAppUser,
  SelectedBranchId,
}: any) => {
  const [Data, setData] = useState<any[]>([]);
  const [searchConfig, setSearchConfig] = useState({ key: '', query: '' });
  const [mainSearch, setMainSearch] = useState('');
  const [editCell, setEditCell] = useState<{
    rowIndex: number;
    key: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added state for loading indicator
  const privileges = useMemo(
    () => getUserPrivileges(SelectedAppUser),
    [SelectedAppUser]
  );

  const GetDataBaseData = async (TableName: string) => {
    setIsLoading(true); // Set loading state to true
    try {
      // Only add branchId filter if the table supports it
      const whereClause = tablesWithBranchId.includes(TableName)
        ? `WHERE 1 AND branchId = '${SelectedBranchId}'`
        : 'WHERE 1';

      const DataRaw = await getValuesWithSql(TableName, whereClause);
      console.log(DataRaw);
      setData(DataRaw);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log('An unknown error occurred');
      }
    } finally {
      setIsLoading(false); // Set loading state to false
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
    | 'room_pay_info_history'
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
  >('rooms');
  const tablesWithBranchId = [
    'rooms',
    'room_specifications',
    'tenants',
    'room_pay_info',
    'room_pay_info_history',

    'brokers',
    'brokersRecommendationList',
    'PastTenantsForRoom',
    'agreements',
    'notification_template_selections',

    'utility_payments',
    'utility_payments_settings',

    'expenses',
  ];
  const validTables = [
    'rooms',
    'room_specifications',
    'tenants',
    'room_pay_info',
    'room_pay_info_history',

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
      await deleteValue(SelectedTable, id, setChangeMade);
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

  const handleRefresh = () => {
    GetDataBaseData(SelectedTable);
  };
  const { isMobileState } = useGlobal();
  return (
    <div className="CalenderContainer">
      <div
        className="CalanderMainContainer"
        style={{
          height: 'calc(100% - var(--30px-V))',
        }}
      >
        <div className="CalenderOptionsMainContainer">
          <div
            style={{
              display: 'flex',
              flexDirection: isMobileState ? 'column' : 'row',
              gap: 'var(--10px-V)',
            }}
          >
           
              <div> <label htmlFor="monthsFutureInput">Select a table: </label>
         
              <select
                value={SelectedTable}
                onChange={OnChangeSelect}
                style={{ height: 'var(--30px-V)' }}
              >
                {validTables.map((val, index) => (
                  <option key={index} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
            <div>
              {' '}
              <label htmlFor="monthsFutureInput">Search all fields: </label>
              <input
                type="text"
                style={{
                  padding: 'var(--5px-V)',
                  borderRadius: 'var(--3px-V)',
                  border: 'var(--1px-V) solid rgb(204, 204, 204)',
                }}
                value={mainSearch}
                onChange={(e) => setMainSearch(e.target.value)}
                placeholder="Main search"
                id="mainSearch"
              />{' '}
            </div>{' '}
          </div>
          <button
            id="refresh"
            onClick={handleRefresh}
            style={{ marginLeft: 'var(--5px-V)' }}
          >
            Refresh
          </button>
        </div>
        <div
          style={{
            overflowX: 'auto',
            height: isMobileState ?'calc(100% - var(--90px-V) - var(--5px-V))' :'calc(100% - var(--55px-V))',
            marginTop: 'var(--5px-V)',
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                fontSize: 'var(--16px-V)',
                color: 'var(--Text-Color)',
              }}
            >
              <img
                src={loadingGif}
                alt="Loading..."
                style={{ width: 'var(--30px-V)', height: 'var(--30px-V)' }}
              />
              Loading...
            </div>
          ) : Data.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                fontSize: 'var(--16px-V)',
                color: 'var(--Text-Color)',
              }}
            >
              No data available
            </div>
          ) : (
            <table className="InfoTable">
              <thead className="InfoTableThead">
                <tr className="InfoTableHeadTR">
                  {Object.keys(Data[0]).map((header, index) => (
                    <th
                      className="InfoTableHeadTh"
                      key={index}
                      onClick={() => handleSearch(header)}
                    >
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
                  {privileges.editDatabaseData ? (
                    <th className="InfoTableHeadTh">Actions</th>
                  ) : (
                    <></>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData(Data, searchConfig.key, searchConfig.query).map(
                  (row, rowIndex) => (
                    <tr
                      className="InfoTableBodyTr"
                      key={rowIndex}
                      style={{
                        backgroundColor:
                          row.id === highlightedRow
                            ? 'var(--Accent-Color50)'
                            : rowIndex % 2 === 0
                            ? 'var(--Secondary-Color20)'
                            : 'var(--Secondary-Color40)',
                      }}
                    >
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <td className="InfoTableBodyTD" key={cellIndex}>
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
                              {[
                                'roomId',
                                'tenantId',
                                'brokerId',
                                'agreementId',
                                'email_template_id',
                                'selectedAgreementId',
                              ].includes(key) &&
                                value &&
                                value !== 'DEFAULT' && (
                                  <button
                                    onClick={() =>
                                      handleGoTo(key, String(value))
                                    }
                                    style={{ marginLeft: 'var(--5px-V)' }}
                                  >
                                    Go to
                                  </button>
                                )}
                            </>
                          )}
                        </td>
                      ))}
                      {privileges.editDatabaseData ? (
                        <td className="InfoTableBodyTD">
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(row.id)}
                          >
                            Delete
                          </button>
                        </td>
                      ) : (
                        <></>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default React.memo(DatabasePage);

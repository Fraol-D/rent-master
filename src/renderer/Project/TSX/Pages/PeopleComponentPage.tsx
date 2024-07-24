import React, { useState } from 'react';

export function PeopleComponentPage({ TenantList, PeopleSelectedPage, PastTenantReviews, RoomList, BrokerList, RefreshDataFromSqlite }: any) {
  const [searchConfig, setSearchConfig] = useState({ key: '', query: '' });

  const filteredData = (data: any[], key: string, query: string) => {
    if (!key || !query) return data;
    return data.filter(item => item[key].toString().toLowerCase().includes(query.toLowerCase()));
  };

  const handleSearch = (key: string) => {
    if (searchConfig.key === key) {
      setSearchConfig({ key: '', query: '' });
    } else {
      setSearchConfig({ key, query: '' });
    }
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchConfig({ ...searchConfig, query: event.target.value });
  };

  const handleRefresh = () => {
    RefreshDataFromSqlite();
  };
const getCorrectPaymentStatment = (text:string) => {
  switch (text) {
    case '30':
      return '30 days';
    case '15':
      return '15 days';
    case '7':
      return '7 days';
    case 'monthly':
      return 'month';
    case 'weekly':
      return 'week';
    case 'daily':
      return 'day';
    default:
      if(text[0] === "-") {
        return text.substring(1,text.length) + " days"
      }
      break;
  }
}
  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        {/* Add your SecondNavBar component here */}
      </div>
      <div className="RoomContainerContainer" style={{ width: '100%', height: 'calc(100% - 45px)', color: 'white' }}>
        {PeopleSelectedPage === 'TenantsList' ? (
          <div className="InfoTableContainer">
            <table className="InfoTable">
              <thead className="InfoTableThead">
                <tr className="InfoTableHeadTR">
                  {['#', 'Name', 'Tel', 'Agreement', 'Occupancy', 'Times', 'Price'].map((col, index) => (
                    <th
                      key={index}
                      className="InfoTableHeadTh"
                      onClick={() => handleSearch(col.toLowerCase())}
                    >
                      {searchConfig.key === col.toLowerCase() ? (
                        <input
                          type="text"
                          value={searchConfig.query}
                          onChange={handleQueryChange}
                          placeholder={`Search ${col}`}
                          autoFocus
                        />
                      ) : (
                        col
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData(TenantList, searchConfig.key, searchConfig.query).map((tenant: any, index: any) => (
                  <tr
                    key={tenant.id}
                    className="InfoTableBodyTr"
                    style={{
                      backgroundColor: index % 2 === 0 ? '#FFFFFF1C' : 'rgba(224 224 224 / 0.06)',
                    }}
                  >
                    <td className="InfoTableBodyTD" style={{ color: 'grey' }}>
                      {index}
                    </td>
                    <td className="InfoTableBodyTD">
                      {tenant.name}
                      <div className="EmailInfoTable">{tenant.email.toLowerCase()}</div>
                    </td>
                    <td className="InfoTableBodyTD PhoneNumberInfoTableContainer">
                      <em>{tenant.phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</em>
                      <em>{tenant.phoneNumber2.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</em>
                    </td>
                    <td className="InfoTableBodyTD">{tenant.SelectedAgreement}</td>
                    <td className="InfoTableBodyTD">
                      <p style={{ color: tenant.RentingOrOut ? 'green' : 'red' }}>{tenant.RentingOrOut ? 'Renting' : 'Out'}</p>
                      <p>{tenant.RentingOrOut ? <>R. {RoomList.find((room: any) => room.tenantId === tenant.id).roomIndex || '0'} F. {RoomList.find((room:any) => room.tenantId === tenant.id).floor || '0'}</> : ''}</p>
                    </td>
                    <td className="InfoTableBodyTD">
                      <div>
                        In {new Date(tenant.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {!tenant.RentingOrOut && (
                        <div>
                          Out {new Date(tenant.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </td>
                    <td className="InfoTableBodyTD">
                      <div>{tenant.agreedPrice}$</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : PeopleSelectedPage === 'BrokersList' ? (

          <div className="InfoTableContainer">
          <table className="InfoTable" style={{ width: '1000px' }}>
            <thead className="InfoTableThead">
              <tr className="InfoTableHeadTR">
                {['#', 'Name', 'Tel', 'Recommended Tenants', 'Added Time'].map((col, index) => (
                  <th
                    key={index}
                    className="InfoTableHeadTh"
                    onClick={() => handleSearch(col.toLowerCase().replace(' ', ''))}
                  >
                    {searchConfig.key === col.toLowerCase().replace(' ', '') ? (
                      <input
                        type="text"
                        value={searchConfig.query}
                        onChange={handleQueryChange}
                        placeholder={`Search ${col}`}
                        autoFocus
                      />
                    ) : (
                      col
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData(BrokerList, searchConfig.key, searchConfig.query).map((broker: any, index: number) => (
                <tr
                  key={broker.id}
                  className="InfoTableBodyTr"
                  style={{
                    backgroundColor: index % 2 === 0 ? '#FFFFFF1C' : 'rgba(224 224 224 / 0.06)',
                  }}
                >
                  <td className="InfoTableBodyTD" style={{ color: 'grey' }}>
                    {index + 1}
                  </td>
                  <td className="InfoTableBodyTD">
                    {broker.name}
                    {broker.email && (
                      <div className="EmailInfoTable">
                        {broker.email.toLowerCase()}
                      </div>
                    )}
                  </td>
                  <td className="InfoTableBodyTD PhoneNumberInfoTableContainer">
                    <em>
                      {broker.phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                    </em>
                    {broker.phoneNumber2 && (
                      <em>
                        {broker.phoneNumber2.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                      </em>
                    )}
                  </td>
                  <td className="InfoTableBodyTD">
                    {broker.RecommendedTenantsIdList.length}
                  </td>
                  <td className="InfoTableBodyTD">
                    {new Date(broker.AddedTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                
                </tr>
              ))}
            </tbody>
          </table>
        </div>
     ) : PeopleSelectedPage === 'TenantReviews' ? (
      <>
        <table className="InfoTable">
          <thead className="InfoTableThead">
            <tr className="InfoTableHeadTR">
              {['#', 'Tenant', 'Room',"Broker" , "Payment","Total earnings",'Stars','Tenant description', 'End Reason', 'Dates'].map((col, index) => (
                <th
                  key={index}
                  className="InfoTableHeadTh"
                  onClick={() => handleSearch(col.toLowerCase().replace(' ', ''))}
                >
                  {searchConfig.key === col.toLowerCase().replace(' ', '') ? (
                    <input
                      type="text"
                      value={searchConfig.query}
                      onChange={handleQueryChange}
                      placeholder={`Search ${col}`}
                      autoFocus
                    />
                  ) : (
                    col
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData(PastTenantReviews, searchConfig.key, searchConfig.query).map((review: any, index: any) => (
              <tr
                key={review.id}
                className="InfoTableBodyTr"
                style={{
                  backgroundColor: index % 2 === 0 ? '#FFFFFF1C' : 'rgba(224 224 224 / 0.06)',
                }}
              >
               <td className="InfoTableBodyTD" style={{ color: 'grey' }}>
                      {index + 1}
                    </td>
                    <td className="InfoTableBodyTD">
                      {TenantList.find((t: tenant) => t.id === review.tenantId)?.name || "Deleted"}
                      <div className="EmailInfoTable">{TenantList.find((t: tenant) => t.id === review.tenantId)?.email.toLowerCase()}</div>
                    </td>
                    <td className="InfoTableBodyTD">F. {RoomList.find((r: RoomType) => r.id == review.roomId).floor} <br />R. {RoomList.find((r: RoomType) => r.id == review.roomId).roomIndex}</td>
                    <td className="InfoTableBodyTD">{BrokerList.find((b:BrokerType)=>b.id === review.brokerId).name} <div></div>c: <em style={{color:"grey", fontSize:"12px"}}>{review.AgreedCommission}$</em></td>
                    <td className="InfoTableBodyTD">{review.AgreedPrice}$ per {getCorrectPaymentStatment(review.paymentCycleType)}</td>
                    <td className="InfoTableBodyTD">
                      {review.totalEarnings}$
                    </td>
                    <td className="InfoTableBodyTD">
                      {[...Array(5)].map((_, index) => (
                        <span key={index} style={{ color: index < review.Stars ? 'gold' : 'gray' }}>
                          ★
                        </span>
                      ))}
                    </td>
                    <td className="InfoTableBodyTD">{review.description || "---"}</td>
                    <td className="InfoTableBodyTD">{review.endReason  || "---"}</td>
                    <td className="InfoTableBodyTD">
                      <div>
                        In {new Date(review.enterDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div>
                        Out {new Date(review.exitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
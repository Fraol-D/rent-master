import { builtinModules } from 'module';
import React, { useState } from 'react';
import { toEthiopianDateString } from 'renderer/Project/JS/Calendar Converter';
import { Input } from '../Helpers/CustomReactComponents';
import CurrencySign, { formatNumberWithSuffix } from '../Helpers/CurrencySign';

export function PeopleComponentPage({
  TenantList,
  PeopleSelectedPage,
  PastTenantReviews,
  RoomList,
  BrokerList,
  RefreshDataFromSqlite,
  BrokerRecommendationList,
  agreementApi,
}: any) {
  const [searchConfig, setSearchConfig] = useState({ key: '', query: '' });
  const [mainSearch, setMainSearch] = useState('');

  const filteredData = (data: any[], key: string, query: string) => {
    if (mainSearch) {
      return data.filter((item) =>
        Object.values(item).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(mainSearch.toLowerCase())
        )
      );
    }
    if (!key || !query) return data;
    return data.filter((item) =>
      item[key].toString().toLowerCase().includes(query.toLowerCase())
    );
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

  const handleMainSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMainSearch(event.target.value);
  };

  const handleRefresh = () => {
    RefreshDataFromSqlite();
  };

  const getCorrectPaymentStatment = (text: string) => {
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
      case 'Annually':
        return 'year';
      case 'daily':
        return 'day';
      default:
        if (text[0] === '-') {
          return text.substring(1, text.length) + ' days';
        }
        break;
    }
  };

  const highlightText = (text: any, highlight: string) => {
    const stringText = String(text);
    if (!highlight.trim()) {
      return <span>{stringText}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = stringText.split(regex);
    return (
      <span>
        {parts.filter(String).map((part, i) => {
          return regex.test(part) ? (
            <mark key={i} style={{ backgroundColor: 'var(--Accent-Color)', color: 'var(--Text-Color)', padding: '0 var(--2px-V)' }}>
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </span>
    );
  };

  const [Agreements, setAgreements] = useState<agreements[]>([]);
  const [AgreementsId, setAgreementsId] = useState<string>('');

  const HandleOpenClicked = (tenantId: string) => {
    const roomType = RoomList.find((r: RoomType) => r.tenantId === tenantId);
    getAgreements(roomType);
    setAgreementsId(tenantId);
  };

  const getAgreements = async (roomType: any) => {
    const agreements = await agreementApi.getAgreementsByRoomIdApi(roomType.id);
    console.log('lol');

    const sortedAgreements = agreements.sort(
      (a: agreements, b: agreements) =>
        new Date(a.signTime).getTime() - new Date(b.signTime).getTime()
    );

    const selectedIndex = sortedAgreements.findIndex(
      (agreement: agreements) => agreement.id === roomType.selectedAgreementId
    );

    if (selectedIndex !== -1) {
      const selectedAgreement = sortedAgreements.splice(selectedIndex, 1)[0];
      sortedAgreements.push(selectedAgreement);
    }
    console.log(sortedAgreements);

    setAgreements(sortedAgreements);
  };

  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        {/* Add your SecondNavBar component here */}
      </div>
      <div
        className="RoomContainerContainer"
        style={{ width: '100%', height: 'calc(100% - var(--60px-V))' }}
      >
        <div style={{ marginBottom: 'var(--20px-V)' }}>
   
         <input
            type="text"
            value={mainSearch}
            onChange={handleMainSearch}
            placeholder="Search all fields..."
            style={{
              width: 'var(--300px-V)',
              padding: 'var(--10px-V)',
              fontSize: 'var(--16px-V)',
              borderRadius: 'var(--8px-V)',
              border: 'var(--1px-V) solid var(--Secondary-Color)',
           
              color: 'var(--Text-Color)',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
        {PeopleSelectedPage === 'TenantsList' ? (
          <>
                       {' '}
            <div style={{ marginBottom: 'var(--20px-V)' }}>
                                       {' '}
            </div>
                       {' '}
            <div className="InfoTableContainer">
                           {' '}
              <table className="InfoTable">
                               {' '}
                <thead className="InfoTableThead">
                                   {' '}
                  <tr className="InfoTableHeadTR">
                                       {' '}
                    {[
                      '#',
                      'Name',
                      'Tel',
                      'Description',
                      'TIN',
                      'Occupancy',
                      'Rent Reason',
                      'Agreement',

                      'Times',
                      'Price',
                      'AddedTime',
                    ].map((col, index) => (
                      <th
                        key={index}
                        className="InfoTableHeadTh"
                        onClick={() => handleSearch(col.toLowerCase())}
                      >
                                               {' '}
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
                                             {' '}
                      </th>
                    ))}
                                     {' '}
                  </tr>
                                 {' '}
                </thead>
                               {' '}
                <tbody>
                                   {' '}
                  {filteredData(
                    TenantList,
                    searchConfig.key,
                    searchConfig.query
                  ).map((tenant: any, index: any) => (
                    <tr
                      key={tenant.id}
                      className="InfoTableBodyTr"
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--Secondary-Color20)'
                            : 'var(--Secondary-Color40)',
                      }}
                    >
                                           {' '}
                      <td
                        className="InfoTableBodyTD"
                        style={{ color: 'var(--Text-Color-Grey)' }}
                      >
                                               {' '}
                        {highlightText(index.toString(), mainSearch)}           
                                 {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD">
                                               {' '}
                        {highlightText(tenant.name, mainSearch)}               
                               {' '}
                        <div className="EmailInfoTable">
                                                   {' '}
                          {highlightText(
                            tenant.email.toLowerCase(),
                            mainSearch
                          )}
                                                 {' '}
                        </div>
                                             {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD PhoneNumberInfoTableContainer">
                                               {' '}
                        <em>{highlightText(tenant.phoneNumber, mainSearch)}</em>
                                               {' '}
                        <em>
                                                   {' '}
                          {highlightText(tenant.phoneNumber2, mainSearch)}     
                                           {' '}
                        </em>
                                             {' '}
                      </td>
                                   
                      <td className="InfoTableBodyTD">
                                       
                        {highlightText(tenant.description || 'N/A', mainSearch)}
                                     
                      </td>{' '}
                           
                      <td className="InfoTableBodyTD">
                                               {' '}
                        {highlightText(tenant.TIN || 'N/A', mainSearch)}       
                                     {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD">
                                               {' '}
                        <p
                          style={{
                            color: tenant.RentingOrOut ? 'green' : 'red',
                          }}
                        >
                                                   {' '}
                          {highlightText(
                            tenant.RentingOrOut ? 'Renting' : 'Out',
                            mainSearch
                          )}
                                                 {' '}
                        </p>
                                               {' '}
                        <p>
                                                   {' '}
                          {tenant.RentingOrOut ? (
                            <>
                                                            Rm.                
                                           {' '}
                              {highlightText(
                                RoomList.find(
                                  (room: any) => room.tenantId === tenant.id
                                )?.roomIndex || 'D',
                                mainSearch
                              )}{' '}
                                                            Flr.                
                                           {' '}
                              {highlightText(
                                RoomList.find(
                                  (room: any) => room.tenantId === tenant.id
                                )?.floor || 'D',
                                mainSearch
                              )}
                                                         {' '}
                            </>
                          ) : (
                            ''
                          )}
                                                 {' '}
                        </p>
                                             {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD">
                                               {' '}
                        {highlightText(tenant.RentReason || 'N/A', mainSearch)} 
                                           {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD">
                                               {' '}
                        {highlightText(tenant.SelectedAgreement, mainSearch)}   
                                           {' '}
                        {tenant.SelectedAgreement === 'Fixed-Term' ? (
                          tenant.RentingOrOut ? (
                            <button
                              onClick={() => {
                                HandleOpenClicked(tenant.id);
                              }}
                            >
                                                          {' open'}             
                                         {' '}
                            </button>
                          ) : (
                            <></>
                          )
                        ) : (
                          <></>
                        )}
                                             {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD">
                                               {' '}
                        <div>
                          In{' '}
                          {highlightText(
                            new Date(tenant.startTime).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            ),
                            mainSearch
                          )}
                                                 {' '}
                        </div>
                                               {' '}
                        {!tenant.RentingOrOut && (
                          <div>
                            Out{' '}
                            {highlightText(
                              new Date(tenant.endTime).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              ),
                              mainSearch
                            )}
                                                     {' '}
                          </div>
                        )}
                                             {' '}
                      </td>
                                           {' '}
                      <td className="InfoTableBodyTD">
                                               {' '}
                        <div>
                                                   {' '}
                          {highlightText(
                           formatNumberWithSuffix(tenant.agreedPrice.toLocaleString()) + CurrencySign(tenant.Currency),
                            mainSearch
                          )}
                                                 {' '}
                        </div>
                                             {' '}
                      </td>
                         {' '}
                      <td
                        className="InfoTableBodyTD"
                        title={toEthiopianDateString(
                          new Date(tenant.AddedTime)
                        )}
                      >
                                                 {' '}
                        {highlightText(
                          new Date(tenant.AddedTime).toDateString(),
                          mainSearch
                        )}
                                             
                      </td>
                                     
                    </tr>
                  ))}
                                 {' '}
                </tbody>
                             {' '}
              </table>
                           {' '}
              {Agreements.length >= 1 && (
                <div
                  className="InfoTableContainer"
                  style={{ marginTop: 'var(--40px-V)' }}
                >
                  Tenant Name:{' '}
                  {TenantList.find(
                    (t: tenant) =>
                      t.id === Agreements[Agreements.length - 1].tenantId
                  )?.name || 'Deleted'}
                  {' --- '}Occupancy: Floor:{' '}
                  {
                    RoomList.find(
                      (r: RoomType) =>
                        r.id === Agreements[Agreements.length - 1].roomId
                    ).floor
                  }
                  {' - '}Room:    {' '}
                  {
                    RoomList.find(
                      (r: RoomType) =>
                        r.id === Agreements[Agreements.length - 1].roomId
                    ).roomIndex
                  }
                                                     {' '}
                  <table
                    className="InfoTable"
                    style={{ width: 'var(--1100px-V)' }}
                  >
                                       {' '}
                    <thead className="InfoTableThead">
                                           {' '}
                      <tr className="InfoTableHeadTR">
                                               {' '}
                        {[
                          '#',
                          'Start Time',
                          'End Time',
                          'Sign Time',
                          'Agreed Price',
                          'Payment Cycle',
                          'Memo',
                          'Rent Reserved',
                          'Representative',
                          'Status',
                        ].map((col, index) => (
                          <th key={index} className="InfoTableHeadTh">
                                                        {col}                   
                                 {' '}
                          </th>
                        ))}
                                             {' '}
                      </tr>
                                         {' '}
                    </thead>
                                       {' '}
                    <tbody>
                                           {' '}
                      {Agreements.filter(
                        (agr: agreements) => agr.tenantId === AgreementsId
                      ).map((agreement: agreements, index: number) => (
                        <tr
                          key={agreement.id}
                          className="InfoTableBodyTr"
                          style={{
                            backgroundColor:
                              index % 2 === 0
                                ? '#FFFFFF1C'
                                : 'rgba(224 224 224 / 0.06)',
                          }}
                        >
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {highlightText(index, mainSearch)}                 
                                     {' '}
                          </td>
                                                     {' '}
                          <td
                            className="InfoTableBodyTD"
                            title={toEthiopianDateString(
                              new Date(agreement.startTime)
                            )}
                          >
                                                         {' '}
                            {highlightText(
                              new Date(agreement.startTime).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              ),
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td
                            className="InfoTableBodyTD"
                            title={toEthiopianDateString(
                              new Date(agreement.endTime)
                            )}
                          >
                                                         {' '}
                            {highlightText(
                              new Date(agreement.endTime).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              ),
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td
                            className="InfoTableBodyTD"
                            title={toEthiopianDateString(
                              new Date(agreement.signTime)
                            )}
                          >
                                                         {' '}
                            {highlightText(
                              new Date(agreement.signTime).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              ),
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {highlightText(
                              formatNumberWithSuffix(agreement.agreedPrice.toLocaleString()) + CurrencySign(agreement.Currency),
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {highlightText(
                              agreement.paymentCycleType,
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {highlightText(agreement.Memo, mainSearch)}         
                                             {' '}
                          </td>
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {highlightText(
                              agreement.RentReserved.toLocaleString() + CurrencySign(agreement.Currency),
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {highlightText(
                              agreement.representative,
                              mainSearch
                            )}
                                                       {' '}
                          </td>
                                                     {' '}
                          <td className="InfoTableBodyTD">
                                                         {' '}
                            {RoomList.find(
                              (r: RoomType) => r.id === agreement.roomId
                            ).selectedAgreementId === agreement.id
                              ? 'Current'
                              : 'Expired'}
                                                       {' '}
                          </td>
                                                   {' '}
                        </tr>
                      ))}
                                         {' '}
                    </tbody>
                                     {' '}
                  </table>
                                 {' '}
                </div>
              )}
                         {' '}
            </div>
                     {' '}
          </>
        ) : PeopleSelectedPage === 'BrokersList' ? (
          <div className="InfoTableContainer">
            <table className="InfoTable" style={{ width: 'var(--1000px-V)' }}>
              <thead className="InfoTableThead">
                <tr className="InfoTableHeadTR">
                  {[
                    '#',
                    'Name',
                    'Tel',
                    'Recommended Tenants',
                    'Added Time',
                  ].map((col, index) => (
                    <th
                      key={index}
                      className="InfoTableHeadTh"
                      onClick={() =>
                        handleSearch(col.toLowerCase().replace(' ', ''))
                      }
                    >
                      {searchConfig.key ===
                      col.toLowerCase().replace(' ', '') ? (
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
                {filteredData(
                  BrokerList,
                  searchConfig.key,
                  searchConfig.query
                ).map((broker: any, index: number) => (
                  <tr
                    key={broker.id}
                    className="InfoTableBodyTr"
                    style={{
                      backgroundColor:
                        index % 2 === 0
                          ? '#FFFFFF1C'
                          : 'rgba(224 224 224 / 0.06)',
                    }}
                  >
                    <td
                      className="InfoTableBodyTD"
                      style={{ color: 'var(--Text-Color-Grey)' }}
                    >
                      {highlightText(index + 1, mainSearch)}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(broker.name, mainSearch)}
                      {broker.email && (
                        <div className="EmailInfoTable">
                          {highlightText(
                            broker.email.toLowerCase(),
                            mainSearch
                          )}
                        </div>
                      )}
                    </td>
                    <td className="InfoTableBodyTD PhoneNumberInfoTableContainer">
                      <em>
                        {highlightText(
                          broker.phoneNumber.replace(
                            /(\d{4})(\d{3})(\d{3})/,
                            '$1 $2 $3'
                          ),
                          mainSearch
                        )}
                      </em>
                      {broker.phoneNumber2 && (
                        <em>
                          {highlightText(
                            broker.phoneNumber2.replace(
                              /(\d{4})(\d{3})(\d{3})/,
                              '$1 $2 $3'
                            ),
                            mainSearch
                          )}
                        </em>
                      )}
                    </td>
                    <td
                      className="InfoTableBodyTD"
                      style={{ height: 'var(--50px-V)' }}
                    >
                      <div
                        style={{
                          maxHeight: 'var(--65px-V)',
                          overflowY: 'auto',
                          padding: 'var(--5px-V)',
                          border: 'var(--1px-V) solid grey',
                          borderRadius: 'var(--4px-V)',
                        }}
                      >
                        {BrokerRecommendationList.filter(
                          (recommendation: BrokerRecommendationType) =>
                            recommendation.brokerId === broker.id
                        ).map(
                          (
                            recommendation: BrokerRecommendationType,
                            index: number
                          ) => (
                            <div
                              key={index}
                              style={{
                                marginBottom: 'var(--5px-V)',
                                fontSize: 'var(--12px-V)',
                                lineHeight: '1.4',
                              }}
                            >
                              <span style={{ fontWeight: 'bold' }}>
                                {highlightText(
                                  TenantList.find(
                                    (t: tenant) =>
                                      t.id ===
                                      recommendation.recommendedTenantId
                                  )?.name || '',
                                  mainSearch
                                )}
                              </span>
                              <span style={{ color: '#A1A1A1' }}>
                                {' '}
                                (
                                {highlightText(
                                  new Date(
                                    recommendation.AddedTime
                                  ).toDateString(),
                                  mainSearch
                                )}
                                )
                              </span>
                              <br />
                              <span style={{ color: 'var(--Accent-Color)' }}>
                                Commission: $
                                {highlightText(
                                  formatNumberWithSuffix(recommendation.AgreedCommission.toLocaleString()),
                                  mainSearch
                                )}
                              </span>
                              <span
                                style={{
                                  marginLeft: 'var(--10px-V)',
                                  color: 'var(--Accent-Color)',
                                }}
                              >
                                Floor:{' '}
                                {highlightText(
                                  RoomList.find(
                                    (r: RoomType) =>
                                      r.id === recommendation.roomId
                                  )?.floor || '',
                                  mainSearch
                                )}
                                , Room:{' '}
                                {highlightText(
                                  RoomList.find(
                                    (r: RoomType) =>
                                      r.id === recommendation.roomId
                                  )?.roomIndex || '',
                                  mainSearch
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>{' '}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(
                        new Date(broker.AddedTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                        mainSearch
                      )}
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
                  {[
                    '#',
                    'Tenant',
                    'Room',
                    'Broker',
                    'Payment',
                    'Total earnings',
                    'Stars',
                    'Tenant description',
                    'End Reason',
                    'Dates',
                  ].map((col, index) => (
                    <th
                      key={index}
                      className="InfoTableHeadTh"
                      onClick={() =>
                        handleSearch(col.toLowerCase().replace(' ', ''))
                      }
                    >
                      {searchConfig.key ===
                      col.toLowerCase().replace(' ', '') ? (
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
                {filteredData(
                  PastTenantReviews,
                  searchConfig.key,
                  searchConfig.query
                ).map((review: any, index: any) => (
                  <tr
                    key={review.id}
                    className="InfoTableBodyTr"
                    style={{
                      backgroundColor:
                        index % 2 === 0
                          ? '#FFFFFF1C'
                          : 'rgba(224 224 224 / 0.06)',
                    }}
                  >
                    <td
                      className="InfoTableBodyTD"
                      style={{ color: 'var(--Text-Color-Grey)' }}
                    >
                      {highlightText(index + 1, mainSearch)}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(
                        TenantList.find((t: tenant) => t.id === review.tenantId)
                          ?.name || 'Deleted',
                        mainSearch
                      )}
                      <div className="EmailInfoTable">
                        {highlightText(
                          TenantList.find(
                            (t: tenant) => t.id === review.tenantId
                          )?.email.toLowerCase() || '',
                          mainSearch
                        )}
                      </div>
                    </td>
                    <td className="InfoTableBodyTD">
                      Flr.{' '}
                      {highlightText(
                        RoomList.find((r: RoomType) => r.id == review.roomId)
                          ?.floor || 'D',
                        mainSearch
                      )}{' '}
                      <br />
                      Rm.{' '}
                      {highlightText(
                        RoomList.find((r: RoomType) => r.id == review.roomId)
                          ?.roomIndex || 'D',
                        mainSearch
                      )}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(
                        BrokerList.find(
                          (b: BrokerType) => b.id === review.brokerId
                        )?.name || 'none',
                        mainSearch
                      )}{' '}
                      <div></div>c:{' '}
                      <em
                        style={{
                          color: 'var(--Text-Color-Grey)',
                          fontSize: 'var(--12px-V)',
                        }}
                      >
                        {highlightText(
                          review.AgreedCommission.toLocaleString() || '',
                          mainSearch
                        )}
                        {CurrencySign(review.Currency)}
                      </em>
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(
                        formatNumberWithSuffix(review.AgreedPrice.toLocaleString()),
                        mainSearch
                      )}
                      {CurrencySign(review.Currency)} per{' '}
                      {highlightText(
                        getCorrectPaymentStatment(review.paymentCycleType),
                        mainSearch
                      )}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(
                        formatNumberWithSuffix(review.totalEarnings.toLocaleString()),
                        mainSearch
                      )}
                      {CurrencySign(review.Currency)}
                    </td>
                    <td className="InfoTableBodyTD">
                      {[...Array(5)].map((_, index) => (
                        <span
                          key={index}
                          style={{
                            color: index < review.Stars ? 'gold' : 'gray',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(review.description || '---', mainSearch)}
                    </td>
                    <td className="InfoTableBodyTD">
                      {highlightText(review.endReason || '---', mainSearch)}
                    </td>
                    <td className="InfoTableBodyTD">
                      <div>
                        In{' '}
                        {highlightText(
                          new Date(review.enterDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          ),
                          mainSearch
                        )}
                      </div>
                      <div>
                        Out{' '}
                        {highlightText(
                          new Date(review.exitDate).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          ),
                          mainSearch
                        )}
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

import React from 'react';
import Room from '../Helpers/Room';
export function PeopleComponentPage({ TenantList }: { TenantList: Tenant[] }) {
  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        {/* Add your SecondNavBar component here */}
      </div>
      <div
        className="RoomContainerContainer"
        style={{
          width: '100%',
          height: 'calc(100% - 45px)',
          color: 'white',
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Phone Number 2</th>
              <th>Email</th>
              <th>Agreement</th>
              <th>Renting/Out</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Agreed Price</th>
            </tr>
          </thead>
          <tbody>
            {TenantList.map((tenant) => (
              <tr key={tenant.id}>
                <td>{tenant.name}</td>
                <td>{tenant.phoneNumber}</td>
                <td>{tenant.phoneNumber2}</td>
                <td>{tenant.email}</td>
                <td>{tenant.SelectedAgreement}</td>
                <td>{tenant.RentingOrOut ? 'Renting' : 'Out'}</td>
                <td>{tenant.startTime}</td>
                <td>{tenant.endTime}</td>
                <td>{tenant.agreedPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
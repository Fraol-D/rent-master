import React, { useState, useEffect } from 'react';

interface LeavePanelProps {
  tenant: tenant;
  room: RoomType;
  totalIncome: number;
  paymentNumbers: number;
  incompletePastPayments: number;
}

const LeavePanel = ({
  tenant,
  room,
  totalIncome,
  paymentNumbers,
  incompletePastPayments,
  extraPayments,
  setExtraPayments,
  tenantRating,
  setTenantRating,
  tenantDescription,
  setTenantDescription,
  endReason,
  setEndReason,
}: any) => {
  // Calculate stayed duration
  const startTime = new Date(tenant.startTime);
  const currentTime = new Date();
  const timeDiff = currentTime.getTime() - startTime.getTime();
  const daysStayed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const monthsStayed = Math.floor(daysStayed / 30);
  const daysRemaining = daysStayed % 30;

  const getCycle = () => {
    switch (room.PaymentCycleType) {
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
      case 'custom':
        return `${room.PaymentCycleCustomeDays} days`;
      default:
        return 'custom';
    }
  };

  return (
    <div
      style={{
        width: '90%',
        padding: 'var(--10px-V)',
        borderRadius: 'var(--10px-V)',
        color: '#fff',
      }}
    >
      <section style={{ marginBottom: 'var(--20px-V)' }}>
        <h3>Tenant Information</h3>
        <p>Name: {tenant.name}</p>
        <p>Telephone 1: {tenant.phoneNumber}</p>
        <p>Telephone 2: {tenant.phoneNumber2 || 'N/A'}</p>
        <p>Email: {tenant.email || 'N/A'}</p>
      </section>

      <section style={{ marginBottom: 'var(--20px-V)' }}>
        <h3>Agreed Terms</h3>
        <p>
          Payment cycle: {tenant.agreedPrice} per {getCycle()}
        </p>
        <p>Started on: {new Date(tenant.startTime).toLocaleDateString()}</p>
        <p>
          Stayed for: {monthsStayed} months and {daysRemaining} days
        </p>
      </section>

      <section style={{ marginBottom: 'var(--20px-V)' }}>
        <h3>Payments</h3>
        <p>Total payments till now: {paymentNumbers}</p>
        <p>Total Income till now: ${totalIncome}</p>
        <p>Unpaid payments : {incompletePastPayments}</p>
        <label>
          Extra Payments (damages?):
          <input
            type="text"
            value={extraPayments}
            className="AddANewRoomInputsMid"
            onChange={(e) => setExtraPayments(e.target.value)}
          />
        </label>
      </section>

      <section style={{ marginBottom: 'var(--20px-V)' }}>
        <h3>Tenant Details</h3>
        <label>
          Rate the tenant:
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                cursor: 'pointer',
                color: tenantRating >= star ? 'gold' : 'grey',
              }}
              onClick={() => setTenantRating(star)}
            >
              ★
            </span>
          ))}
        </label>
        <div style={{ marginTop: 'var(--10px-V)' }}>
          <label>
            Description of tenant's stay:
            <textarea
              value={tenantDescription}
              onChange={(e) => setTenantDescription(e.target.value)}
              style={{
                width: '100%',
                height: 'var(--80px-V)',
                borderRadius: 'var(--10px-V)',
                backgroundColor: 'var(--Secondary-Color)',
                color: 'white',
              }}
            />
          </label>
        </div>
        <div style={{ marginTop: 'var(--10px-V)' }}>
          <label>
            End Reason:
            <input
              type="text"
              value={endReason}
              onChange={(e) => setEndReason(e.target.value)}
              style={{ width: '100%' }}
              className="AddANewRoomInputsMid"
            />
          </label>
        </div>
      </section>
    </div>
  );
};

export default React.memo(LeavePanel);

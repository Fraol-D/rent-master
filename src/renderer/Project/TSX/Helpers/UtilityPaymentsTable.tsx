import {
  addValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
import React, { useState, useCallback } from 'react';
const { v4: uuidv4 } = require('uuid');

const UtilityPaymentsTable = ({
  roomId,
  userId,
  utilityPayments,
  updateRoomPropertyLocal,
  setChangeMade,
}: any) => {
  const [tempPrices, setTempPrices] = useState<{ [key: string]: string }>(
    utilityPayments.reduce((acc: any, utility: UtilityPaymentSettings) => {
      acc[utility.id] = utility.price.toString();
      return acc;
    }, {})
  );

  const handleUtilityChange = useCallback(async (
    index: number,
    field: 'useThis' | 'price' | 'alwaysAsk',
    value: boolean | string,
    utility: UtilityPaymentSettings
  ) => {
    const updatedUtilities = [...utilityPayments];
    updatedUtilities[index] = {
      ...updatedUtilities[index],
      [field]: value,
    };
    updateRoomPropertyLocal(
      roomId,
      'utilityPayments',
      utilityPayments.map((u: any) => {
        if (u.type === utility.type && u.id === utility.id) {
          return {
            ...u,
            [field]: value,
          };
        }
        return u;
      })
    );

    const utilityPaymentRaw = await getValuesWithSql(
      'utility_payments_settings',
      `WHERE type = '${utility.type}' AND roomId = '${roomId}'`
    );
    if (utilityPaymentRaw == 0) {
      await addValue(
        'utility_payments_settings',
        {
          id: uuidv4(),
          roomId: roomId,
          type: utility.type,
          useThis: field === 'useThis' ? value : utility.useThis,
          price: field === 'price' ? value : utility.price,
          alwaysAsk: field === 'alwaysAsk' ? value : utility.alwaysAsk,
          userId: userId,
        },
        setChangeMade
      );
    } else {
      await updateValue(
        'utility_payments_settings',
        utility.id,
        field,
        value,
        setChangeMade,
        utility[field]
      );
    }
  }, [utilityPayments, roomId, userId, updateRoomPropertyLocal, setChangeMade]);

  const handlePriceChange = (id: string, value: string) => {
    setTempPrices(prev => ({ ...prev, [id]: value }));
  };

  const handlePriceUpdate = useCallback((index: number, utility: UtilityPaymentSettings) => {
    const newPrice = tempPrices[utility.id];
    if (newPrice !== utility.price.toString()) {
      handleUtilityChange(index, 'price', newPrice, utility);
    }
  }, [tempPrices, handleUtilityChange]);

  return (
    <table style={{ fontSize: '14px', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: '5px', textAlign: 'left' }}>Types</th>
          <th style={{ padding: '5px', textAlign: 'center' }}>Use</th>
          <th style={{ padding: '5px', textAlign: 'center' }}>Price</th>
          <th style={{ padding: '5px', textAlign: 'center' }}>Always Ask</th>
        </tr>
      </thead>
      <tbody>
        {utilityPayments.map((utility: UtilityPaymentSettings, index: number) => (
          <tr key={index}>
            <td style={{ padding: '5px' }}>{utility.type}</td>
            <td style={{ padding: '5px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={utility.useThis}
                onChange={(e) =>
                  handleUtilityChange(
                    index,
                    'useThis',
                    e.target.checked,
                    utility
                  )
                }
              />
            </td>
            <td style={{ padding: '5px', textAlign: 'center' }}>
              <input
                type="number"
                value={tempPrices[utility.id]}
                onChange={(e) => handlePriceChange(utility.id, e.target.value)}
                onBlur={() => handlePriceUpdate(index, utility)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePriceUpdate(index, utility);
                  }
                }}
                style={{ width: '70px' }}
              />
              $
            </td>
            <td style={{ padding: '5px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={utility.alwaysAsk}
                onChange={(e) =>
                  handleUtilityChange(
                    index,
                    'alwaysAsk',
                    e.target.checked,
                    utility
                  )
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default React.memo(UtilityPaymentsTable);

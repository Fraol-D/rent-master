import { Input } from './CustomReactComponents';
import {
  addValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
import React, { useState, useCallback } from 'react';
import { GetCurrencyAsOptionsOnSelect } from './CurrencySign';
import { v4 as uuidv4 } from 'uuid';

const UtilityPaymentsTable = ({
  roomId,
  userId,
  utilityPayments,
  updateRoomPropertyLocal,
  setChangeMade,
  SelectedBranchId,
}: any) => {
  const [tempPrices, setTempPrices] = useState<{ [key: string]: string }>(
    utilityPayments.reduce((acc: any, utility: UtilityPaymentSettings) => {
      acc[utility.id] = utility.price.toString();
      return acc;
    }, {})
  );

  const handleUtilityChange = useCallback(
    async (
      index: number,
      field: 'useThis' | 'price' | 'alwaysAsk' | 'Currency',
      value: boolean | string,
      utility: UtilityPaymentSettings
    ) => {
      console.log(
        `Starting to handle utility change for index ${index}, field ${field}, and value ${value}`
      );
      const updatedUtilities = [...utilityPayments];
      updatedUtilities[index] = {
        ...updatedUtilities[index],
        [field]: value,
      };
      console.log(
        `Updated utilities locally: ${JSON.stringify(updatedUtilities)}`
      );
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
      console.log(`Updated room property locally for utilityPayments`);

      const utilityPaymentRaw = await getValuesWithSql(
        'utility_payments_settings',
        `WHERE type = '${utility.type}' AND roomId = '${roomId}'`
      );
      console.log(
        `Fetched utility payment raw data: ${JSON.stringify(utilityPaymentRaw)}`
      );
      if (utilityPaymentRaw.length == 0) {
        console.log(`No existing utility payment found, adding a new one.`);
        await addValue(
          'utility_payments_settings',
          {
            id: uuidv4(),
            roomId: roomId,
            type: utility.type,
            useThis: field === 'useThis' ? value : utility.useThis,
            price: field === 'price' ? value || 0 : utility.price || 0,
            alwaysAsk: field === 'alwaysAsk' ? value : utility.alwaysAsk,
            Currency: field === 'Currency' ? value : utility.Currency,
            userId: userId,
            branchId: SelectedBranchId,
          },
          setChangeMade
        );
        console.log(`Added a new utility payment setting.`);
      } else {
        console.log(
          `Existing utility payment found, updating it., id: ${utilityPaymentRaw[0].id}`
        );
        await updateValue(
          'utility_payments_settings',
          utilityPaymentRaw[0].id,
          field,
          value,
          setChangeMade,
          utility[field]
        );
        console.log(`Updated utility payment setting.`);
      }
    },
    [utilityPayments, roomId, userId, updateRoomPropertyLocal, setChangeMade]
  );

  const handlePriceChange = (id: string, value: string) => {
    setTempPrices((prev) => ({ ...prev, [id]: value }));
  };

  const handlePriceUpdate = useCallback(
    (index: number, utility: UtilityPaymentSettings) => {
      const newPrice = tempPrices[utility.id];
      console.log(`New price: ${newPrice}, old price: ${utility.price}`);
      if (newPrice !== utility.price.toString()) {
        handleUtilityChange(index, 'price', newPrice, utility);
      }
    },
    [tempPrices, handleUtilityChange]
  );

  return (
    <table style={{ fontSize: 'var(--14px-V)', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'left' }}>Types</th>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>Use</th>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
            Price
          </th>
          <th
            style={{
              padding: 'var(--5px-V)',
              textAlign: 'center',
              width: 'var(--10px-V)',
            }}
          >
            Always Ask
          </th>
        </tr>
      </thead>
      <tbody>
        {utilityPayments.map(
          (utility: UtilityPaymentSettings, index: number) => (
            <tr key={index}>
              <td style={{ padding: 'var(--5px-V)' }}>{utility.type}</td>
              <td style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
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
              <td style={{ textAlign: 'center' }}>
                {utility.useThis ? (
                  <>
                    <input
                      type="number"
                      value={tempPrices[utility.id]}
                      onChange={(e) =>
                        handlePriceChange(utility.id, e.target.value)
                      }
                      onBlur={() => handlePriceUpdate(index, utility)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handlePriceUpdate(index, utility);
                        }
                      }}
                      style={{ width: 'var(--70px-V)' }}
                    />
                    <select
                      value={utility.Currency}
                      onChange={(e) =>
                        handleUtilityChange(
                          index,
                          'Currency',
                          e.target.value,
                          utility
                        )
                      }
                      name=""
                      id=""
                    >
                      {GetCurrencyAsOptionsOnSelect()}
                    </select>
                  </>
                ) : (
                  <></>
                )}{' '}
              </td>
              <td style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
                {utility.useThis ? (
                  <>
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
                  </>
                ) : (
                  <></>
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

export default React.memo(UtilityPaymentsTable);

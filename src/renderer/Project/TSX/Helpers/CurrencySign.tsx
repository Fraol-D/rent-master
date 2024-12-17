import { storageManager } from '../../../storeManager';
export const AllCurrencies = ['USD', 'ETB'];
export const CurrencySign = (currency: string) => {
  if (!AllCurrencies.includes(currency)) {
    return currency;
  }
  switch (currency) {
    case 'USD':
      return '$';
    case 'ETB':
      return ' Birr';
    default:
      return currency;
  }
};
export const GetCurrencyAsOptionsOnSelect = () => {
  return AllCurrencies.map((currency, index) => (
    <option key={`${currency}-${index}`} value={currency}>
      {currency}
    </option>
  ));
};
export const GetDefaultCurrency = () => {
  return storageManager.get('defaultCurrency') || 'ETB';
};
export default CurrencySign;
export function formatNumberWithSuffix(input: number | string): string {
  if (input === undefined || input === null) return '0';
  // Convert input to number if it's a string, removing any commas first
  const num =
    typeof input === 'string' ? parseFloat(input.replace(/,/g, '')) : input;

  // Handle invalid input
  if (isNaN(num)) return '0';

  // Handle negative numbers
  const sign = num < 0 ? '-' : '';
  const absNum = Math.abs(num);

  // Get decimal places from electron store
  const decimalPlaces = storageManager.get('abbreviationDecimals') || 2;

  // Define thresholds and suffixes
  const thresholds = [
    { value: 1e9, suffix: 'B' }, // Billions
    { value: 1e6, suffix: 'M' }, // Millions
    { value: 1e3, suffix: 'K' }, // Thousands
  ];

  // Check if abbreviation is enabled
  const shouldAbbreviate = storageManager.get('abbreiviateBigNumbers');
  if (!shouldAbbreviate) {
    return num.toLocaleString('en-US');
  }

  // Find appropriate threshold
  for (const { value, suffix } of thresholds) {
    if (absNum >= value) {
      const divided = absNum / value;

      // Format number with configured decimal places
      if (decimalPlaces === 0) {
        return `${sign}${Math.round(divided)}${suffix}`;
      }
      const formatted = divided.toFixed(decimalPlaces).replace(/\.?0+$/, '');
      return `${sign}${formatted}${suffix}`;
    }
  }
  if (num === undefined || num === null) return input.toString();
  // For smaller numbers, use regular formatting
  return num.toLocaleString('en-US');
}
// Add this helper function to find closest rates
const findClosestRates = (targetDate: number, rates: any[]) => {
  // Sort rates by date
  const sortedRates = [...rates].sort((a, b) => a.id - b.id);

  // Find the closest rate before and after the target date
  let beforeRate = null;
  let afterRate = null;

  for (let i = 0; i < sortedRates.length; i++) {
    if (sortedRates[i].id <= targetDate) {
      beforeRate = sortedRates[i];
    } else {
      afterRate = sortedRates[i];
      break;
    }
  }

  return { beforeRate, afterRate };
};

// Modified conversion function
export const convertCurrency = (params: {
  amountToConvert: number;
  currency: 'USD' | 'ETB';
}): { convertedAmount: number | null; rateInfo: string } => {
  try {
    const amount = parseFloat(params.amountToConvert.toString());
    if (isNaN(amount)) {
      alert('Please enter a valid number');
      return { convertedAmount: null, rateInfo: '' };
    }

    const storedRates = storageManager.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) {
      alert('No exchange rates available. Please update rates first.');
      return { convertedAmount: null, rateInfo: '' };
    }

    const currentDate = Math.floor(Date.now() / 1000); // Current time in seconds
    const { beforeRate, afterRate } = findClosestRates(
      currentDate,
      storedRates
    );

    let rateToUse;
    let rateDescription = '';

    if (beforeRate && !afterRate) {
      // Only have past rate
      rateToUse = beforeRate.rates;
      rateDescription = `Using closest past rate from ${new Date(
        beforeRate.id * 1000
      ).toLocaleDateString()}`;
    } else if (!beforeRate && afterRate) {
      // Only have future rate
      rateToUse = afterRate.rates;
      rateDescription = `Using closest future rate from ${new Date(
        afterRate.id * 1000
      ).toLocaleDateString()}`;
    } else if (beforeRate && afterRate) {
      // Have both past and future rates, calculate weighted average
      const timeDiffBefore = currentDate - beforeRate.id;
      const timeDiffAfter = afterRate.id - currentDate;
      const totalDiff = timeDiffBefore + timeDiffAfter;

      // Weight the rates based on their temporal distance
      rateToUse =
        (beforeRate.rates * timeDiffAfter + afterRate.rates * timeDiffBefore) /
        totalDiff;
      rateDescription = `Using weighted average of rates from ${new Date(
        beforeRate.id * 1000
      ).toLocaleDateString()} and ${new Date(
        afterRate.id * 1000
      ).toLocaleDateString()}`;
    } else {
      // No rates found
      alert('No exchange rates available for conversion');
      return { convertedAmount: 0, rateInfo: '' };
    }

    // Convert based on currency direction
    const result =
      params.currency === 'ETB'
        ? amount / rateToUse // ETB to USD
        : amount * rateToUse; // USD to ETB

    return {
      convertedAmount: result,
      rateInfo: `${rateDescription} (${params.currency} to ${
        params.currency === 'ETB' ? 'USD' : 'ETB'
      })`,
    };
  } catch (error) {
    console.error('Error converting currency:', error);
    alert('Error converting currency');
    return { convertedAmount: 0, rateInfo: '' };
  }
};
// Add this new function to find rate by date
export const getRateByDate = (
  targetDate: number
): {
  rate: number | null;
  rateDate: number | null;
  direction: 'exact' | 'past' | 'future' | 'none';
} => {
  try {
    const storedRates = storageManager.get('exchangeRate');

    if (!storedRates || storedRates.length === 0) {
      return { rate: null, rateDate: null, direction: 'none' };
    }

    // Sort rates by date
    const sortedRates = [...storedRates].sort((a, b) => a.id - b.id);

    // First check for exact match
    const exactMatch = sortedRates.find(
      (rate) => rate.id === Math.floor(targetDate / 1000)
    );
    if (exactMatch) {
      return {
        rate: exactMatch.rates,
        rateDate: exactMatch.id * 1000,
        direction: 'exact',
      };
    }

    // Find closest rate before target date
    const pastRate = [...sortedRates]
      .reverse()
      .find((rate) => rate.id <= Math.floor(targetDate / 1000));

    // Find closest rate after target date
    const futureRate = sortedRates.find(
      (rate) => rate.id >= Math.floor(targetDate / 1000)
    );

    // If we have both past and future rates, use the closest one
    if (pastRate && futureRate) {
      const pastDiff = Math.abs(Math.floor(targetDate / 1000) - pastRate.id);
      const futureDiff = Math.abs(
        futureRate.id - Math.floor(targetDate / 1000)
      );

      if (pastDiff <= futureDiff) {
        return {
          rate: pastRate.rates,
          rateDate: pastRate.id * 1000,
          direction: 'past',
        };
      } else {
        return {
          rate: futureRate.rates,
          rateDate: futureRate.id * 1000,
          direction: 'future',
        };
      }
    }

    // If we only have past rate
    if (pastRate) {
      return {
        rate: pastRate.rates,
        rateDate: pastRate.id * 1000,
        direction: 'past',
      };
    }

    // If we only have future rate
    if (futureRate) {
      return {
        rate: futureRate.rates,
        rateDate: futureRate.id * 1000,
        direction: 'future',
      };
    }

    return { rate: null, rateDate: null, direction: 'none' };
  } catch (error) {
    console.error('Error finding rate by date:', error);
    return { rate: null, rateDate: null, direction: 'none' };
  }
};

// Example usage:
/*
const date = new Date('2024-03-15').getTime();
const { rate, rateDate, direction } = getRateByDate(date);
if (rate) {
  console.log(`Found rate: ${rate}`);
  console.log(`Rate date: ${new Date(rateDate!).toLocaleDateString()}`);
  console.log(`Direction: ${direction}`);
} else {
  console.log('No rate available');
}
*/

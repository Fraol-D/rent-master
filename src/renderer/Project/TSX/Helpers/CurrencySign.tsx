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
  return AllCurrencies.map((currency) => (
    <option value={currency}>{currency}</option>
  ));
};
export const GetDefaultCurrency = () => {
  return window.electron.store.get('defaultCurrency') || 'ETB';
};
export default CurrencySign;
export function formatNumberWithSuffix(input: number | string): string {
  if(input === undefined || input === null) return "0";
  // Convert input to number if it's a string, removing any commas first
  const num = typeof input === 'string' ? parseFloat(input.replace(/,/g, '')) : input;
  
  // Handle invalid input
  if (isNaN(num)) return '0';
  
  // Handle negative numbers
  const sign = num < 0 ? '-' : '';
  const absNum = Math.abs(num);

  // Get decimal places from electron store
  const decimalPlaces = window.electron.store.get('abbreviationDecimals') || 2;
  
  // Define thresholds and suffixes
  const thresholds = [
    { value: 1e9, suffix: 'B' },  // Billions
    { value: 1e6, suffix: 'M' },  // Millions
    { value: 1e3, suffix: 'K' },  // Thousands
  ];
  
  // Check if abbreviation is enabled
  const shouldAbbreviate = window.electron.store.get('abbreiviateBigNumbers');
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
  if(num === undefined || num === null) return input.toString();
  // For smaller numbers, use regular formatting
  return num.toLocaleString('en-US');
}

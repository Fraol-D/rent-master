const AllCurrencies = ['USD', 'ETB'];
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
    <option value={currency}>{(currency)}</option>
  ));
};
export const GetDefaultCurrency = () => {
  return 'ETB';
};
export default CurrencySign;

import React, { useState } from 'react';

import {
  convertToGC,
  toEthiopianDateString,
  toEthiopianMonthString,
  toEthiopianDayString,
} from 'renderer/Project/JS/Calendar Converter';
interface EthiopianCalendarConverterProps {
  onConvert: (gregorianDate: string) => void;
  handleUse: (gagorianDate: number) => void;
  Cancel: () => void;
}

const EthiopianCalanderConverterMenu: React.FC<
  EthiopianCalendarConverterProps
> = ({ onConvert, handleUse, Cancel }) => {
  const [ethiopianDate, setEthiopianDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');

  const handleConvert = () => {
    try {
      const [day, month, year] = ethiopianDate.split('/').map(Number);
      const convertedDate = convertToGC(day, month, year, 0, 0, 0);
      setGregorianDate(convertedDate);
      onConvert(convertedDate);
    } catch (error: any) {
      console.log(error.message);
    }
  };
  const Use = () => {
    try {
      const [day, month, year] = ethiopianDate.split('/').map(Number);
      const convertedDate = convertToGC(day, month, year, 0, 0, 0);
      const date = new Date(convertedDate).getTime();
      handleUse(date);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const converterStyle: React.CSSProperties = {
    backgroundColor: 'var(--Background-Color)',
    padding: 'var(--20px-V)',
    borderRadius: 'var(--8px-V)',
    boxShadow: '0 var(--4px-V) var(--6px-V) rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={overlayStyle}>
      <div style={converterStyle}>
        <h2>Ethiopian Calendar Converter</h2>
        <em>
          Format: <strong>5/13/2015</strong> or date/month(num)/year
        </em>
        <br></br>
        <input
          type="text"
          value={ethiopianDate}
          onChange={(e) => setEthiopianDate(e.target.value)}
          className="StartTime"
          placeholder="Enter Ethiopian date (DD/MM/YYYY)"
        />
        {/* Test cases for input:
        1. Valid Ethiopian date: 01/01/2015
        2. Invalid date format: 2015/01/01
        3. Out of range date: 32/13/2015
        4. Non-numeric input: aa/bb/cccc
        5. Partial date: 01/01
        6. Empty input: 
        7. Special characters: 01@01#2015
        8. Leading/trailing spaces: " 01/01/2015 "
        9. Different separators: 01-01-2015
        10. Leap year: 29/13/2015 (Ethiopian leap year)
        */}
        <button onClick={handleConvert}>Convert</button>
        <button onClick={Use}>USE</button>
        <button onClick={Cancel}>Cancel</button>
        <p>
          Gregorian Date: <strong>{gregorianDate}</strong>
        </p>
        <p>Today's Ethiopian Date: {toEthiopianDateString(new Date())}</p>
      </div>
    </div>
  );
};

export default React.memo(EthiopianCalanderConverterMenu);

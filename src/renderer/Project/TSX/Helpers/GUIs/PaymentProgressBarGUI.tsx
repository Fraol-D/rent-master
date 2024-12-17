import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  isBefore,
  isAfter,
  subDays,
  differenceInDays,
  addDays,
  addMonths,
  addYears,
} from 'date-fns';
import * as d3 from 'd3';
import editIconDark from '../../../../assets/assets/Dark mode/Editicon.png';
import editIconLight from '../../../../assets/assets/Light mode/Editicon.png';
import {
  addValue,
  deleteReceipt2,
  deleteValue,
  GetReceiptFileApi,
  getValuesWithSql,
  updateValue,
  uploadReceiptDocuments,
  uploadReceiptDocumentsOnline,
} from 'Backend/localServerApis';
import UtilityPanel from './UtilityPanel';
import { Payment } from 'electron';
import CurrencySign, { formatNumberWithSuffix } from '../CurrencySign';
import { useAlert } from 'renderer/components/useAlert';
export type RoomPayInfo = {
  Day: number; // milliseconds since January 1, 1970, 00:00:00 UTC
  Paid: boolean;
};

interface Props {
  paymentData: RoomPayInfo[]; //
  agreedPrice: number; //
  roomType: RoomType; //
  tenantList: tenant[]; //
  roomPaymentInfoApi: any;
  refresh: () => void; //
  extendPaymentSchedule: () => void; //
  ShowReceipt: boolean; //
  setShowReceipt: React.Dispatch<React.SetStateAction<boolean>>; //
  setChangeMade: any;
  SelectedUserId: string;
  updateRoomPropertyLocal: any;
  SelectedBranchId: any;
  Currency: string;
  changeProgress: any;
  setChangeProgress: any;
}
import { v4 as uuidv4 } from 'uuid';
import { useGlobal } from 'renderer/components/GlobalContext';
import { useConfirm } from 'renderer/components/useConfirm';

const PaymentProgressBarGUI: React.FC<Props> = ({
  paymentData,
  roomPaymentInfoApi,
  agreedPrice,
  roomType,
  extendPaymentSchedule,
  refresh,
  tenantList,
  ShowReceipt,
  setShowReceipt,
  setChangeMade,
  SelectedUserId,
  updateRoomPropertyLocal,
  SelectedBranchId,
  Currency,
  setChangeProgress,
  changeProgress,
}) => {
  const {
    AllRoomPayInfo,
    setAllRoomPayInfo,
    AllAgreements,
    setAllAgreements,
    AllTenants,
    setAllTenants,
  } = useGlobal();
  const today = new Date().getTime();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const [selectedDates, setSelectedDates] = useState<number[]>([]); // State to track selected dates
  const currentDateRef = useRef<SVGLineElement | null>(null);

  const [showUtilityPanel, setShowUtilityPanel] = useState(false);
  const [payments, setPayments] = useState<RoomPayInfo[]>([]);

  // Add window width state
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
 const { showAlert } = useAlert(); 
  // Add window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate scale factor based on window width
  const getScaleFactor = () => {
    if (windowWidth <= 1280) return 1280 / 1920;
    if (windowWidth <= 1366) return 1366 / 1920;
    if (windowWidth >= 2560) return 3840 / 1920;
    return 1;
  };
const calculatePayments = async () => {
      const newPayments: Payment[] = [];
      let startDate =
        tenantList.find((tenant) => tenant.id === roomType.tenantId)
          ?.startTime || Date.now();
      let endDate = null;
      if (roomType.selectedAgreementId) {
        const agreements = AllAgreements.filter(
          (agreement) => agreement.id === roomType.selectedAgreementId
        );
        if (agreements.length > 0) startDate = agreements[0].startTime;
        if (
          tenantList.find((t: tenant) => t.id === roomType.tenantId)
            ?.SelectedAgreement === 'Fixed-Term'
        )
          if (agreements.length > 0) endDate = agreements[0].endTime;
      }

      let currentDate = new Date(startDate);
      let paymentCount = 0;
      const existingPayments = AllRoomPayInfo.filter(
        (payment) =>
          payment.roomId === roomType.id &&
          payment.tenantId === roomType.tenantId
      );
      let tenantIsFixedTerm =
        tenantList.find((t: tenant) => t.id === roomType.tenantId)
          ?.SelectedAgreement === 'Fixed-Term';
      while (
        (tenantIsFixedTerm || paymentCount < 10 * roomType.paymentShowAmount) &&
        (endDate == null || currentDate < endDate)
      ) {
        const paymentId = `${roomType.id}-${currentDate.getTime()}`;
        newPayments.push({
          id: paymentId,
          Day: currentDate.getTime(),
          Value: roomType.AgreedPrice,
          Paid:
            existingPayments.length > 0
              ? existingPayments.find((p: RoomPayInfo) => p.id === paymentId)
                  ?.Paid
              : false,
          userId: SelectedUserId,
        });

        paymentCount++;

        // Calculate next payment date based on payment cycle
        switch (roomType.PaymentCycleType) {
          case '30':
            currentDate = addDays(currentDate, 30);
            break;
          case '15':
            currentDate = addDays(currentDate, 15);
            break;
          case '7':
            currentDate = addDays(currentDate, 7);
            break;
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'weekly':
            currentDate = addDays(currentDate, 7);
            break;
          case 'custom':
            currentDate = addDays(
              currentDate,
              roomType.PaymentCycleCustomeDays || 30
            );
            break;
          case 'Annually':
            currentDate = addYears(currentDate, 1);
            break;
          default:
            currentDate = addMonths(currentDate, 1);
            break;
        }
      }

      return newPayments;
    };

  useEffect(() => {
    
    calculatePayments().then((payments) =>
      setPayments(payments as RoomPayInfo[])
    );
  }, [roomType, tenantList]);
  const calculatePredictedPayments = async (room: RoomType) => {
    const allPayments = [];
    const today = new Date();
    const yearEnd = new Date(today.getFullYear() + 1, 11, 31);
    const tenant = AllTenants.find((t) => t.id === room.tenantId);
    let startDate = new Date(tenant?.startTime || Date.now()).getTime();

    let endDate = null;
    if (room.selectedAgreementId) {
      const agreements = AllAgreements.filter(
        (agreement) => agreement.id === room.selectedAgreementId
      );
      if (agreements.length > 0) {
        startDate = agreements[0].startTime;
      }
      if (tenant?.SelectedAgreement === 'Fixed-Term') {
        if (agreements.length > 0) {
          endDate = agreements[0].endTime;
        }
      }
    }

    let currentDate = new Date(startDate);
    while (
      currentDate <= yearEnd &&
      (endDate == null || currentDate <= new Date(endDate))
    ) {
      const paymentId = `${room.id}-${currentDate.getTime()}`;
      allPayments.push({
        id: paymentId,
        Day: currentDate.getTime(),
        Value: room.AgreedPrice,
        Paid: false,
        roomId: room.id,
      });

      switch (room.PaymentCycleType) {
        case '30':
          currentDate = addDays(currentDate, 30);
          break;
        case '15':
          currentDate = addDays(currentDate, 15);
          break;
        case '7':
          currentDate = addDays(currentDate, 7);
          break;
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 7);
          break;
        case 'Annually':
          currentDate = addYears(currentDate, 1);
          break;
        case 'custom':
          currentDate = addDays(
            currentDate,
            room.PaymentCycleCustomeDays || 30
          );
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
    }

    const actualPayments = AllRoomPayInfo.filter(
      (payment) =>
        payment.roomId === room.id && payment.tenantId === room.tenantId
    );

    const finalPayments = allPayments.map((payment) => {
      const actualPayment = actualPayments.find(
        (p: any) => p.id === payment.id
      );
      return actualPayment
        ? { ...payment, Paid: actualPayment.Paid === 1 ? true : false }
        : { ...payment, Paid: false };
    });

    if (finalPayments.length === 0) {
      console.log('No payments predicted. Possible reasons:');
      console.log('- No tenant assigned to the room');
      console.log('- No valid start date for the tenant');
      console.log('- No valid payment cycle set for the room');
      console.log('- End date is before or equal to start date');
    }

    return finalPayments;
  };

  const calculateDaysTillNextPayment = (predictedPayments: Payment[]) => {
    const today = new Date();

    if (predictedPayments.length === 0) {
      console.log(
        'No predicted payments available to calculate days till next payment'
      );
      return 0;
    }

    const sortedPayments = predictedPayments.sort((a, b) => a.Day - b.Day);

    let allPaid = true;
    let nextPaymentDays = 0;

    for (const payment of sortedPayments) {
      const paymentDate = new Date(payment.Day);
      const daysDifference = differenceInDays(paymentDate, today);

      if (!payment.Paid) {
        allPaid = false;
        if (daysDifference === 0) {
          return 0;
        } else if (daysDifference < 0) {
          return daysDifference;
        } else {
          nextPaymentDays = daysDifference;
          break; // Exit the loop once we find the next unpaid payment
        }
      }
    }

    if (allPaid) {
      return -98989898; // Return the special number if all payments are paid
    } else {
      return nextPaymentDays;
    }
  };
  const handlePayClick = async (payment: any) => {
    const existingPayment = AllRoomPayInfo.find(
      (p) => p.id === payment.id
    );
    console.log("Existing payment: ",existingPayment)
    const newPaidStatus = !payment.Paid ;
    //setChangeProgress(0);
    
    if (existingPayment) {
      if (newPaidStatus) {
        //setChangeProgress(25);
        await updateValue(
          'room_pay_info',
          payment.id,
          'Paid',
          1,
          setChangeMade,
          0
        );
        setAllRoomPayInfo((prevInfo:any) => prevInfo.map((p:any) => p.id === payment.id ? { ...p, Paid: 1 } : p));
       // setChangeProgress(75);
      } else {
       // setChangeProgress(25);
        await deleteValue('room_pay_info', payment.id, setChangeMade);
        setAllRoomPayInfo((prevInfo:any) => prevInfo.filter((p:any) => p.id !== payment.id));
       // setChangeProgress(75);

      }
    } else if (newPaidStatus) {
  //    setChangeProgress(25);

      await addValue(
        'room_pay_info',
        {
          ...payment,
          Paid: 1,
          roomId: roomType.id,
          tenantId: roomType.tenantId, branchId: SelectedBranchId,
        },
        setChangeMade
      );
      AllRoomPayInfo.push({
        ...payment,
        Paid: 1,
        roomId: roomType.id,
        tenantId: roomType.tenantId,
        branchId: SelectedBranchId,
      })
     // setChangeProgress(75);

    }

    setPayments((prevPayments) =>
      prevPayments.map((p) =>
        p.id === payment.id ? { ...p, Paid: newPaidStatus ? 1 : 0 } : p
      )
    );
    console.log(payments.map((p) =>
      p.id === payment.id ? { ...p, Paid: newPaidStatus ? 1 : 0 } : p
    ))
   
    updateRoomPropertyLocal(
      roomType.id,
      'DaysTillNextPayment',
      calculateDaysTillNextPayment(await calculatePredictedPayments(roomType))
    );
  //  setChangeProgress(98);
   
  };
  const {confirm} = useConfirm();
  useEffect(() => {
    if (payments.length > 0 && svgRef.current) {
      const scaleFactor = getScaleFactor();
      const sortedPaymentData = [...payments].sort((a, b) => a.Day - b.Day);
      const svg = d3.select(svgRef.current);

      // Clear existing SVG content
      svg.selectAll('*').remove();

      // Scale all measurements
      const basePaymentWidth = 75;
      const paymentWidth = basePaymentWidth * scaleFactor;
      const width = sortedPaymentData.length * paymentWidth + 70 * scaleFactor;
      const height = (ShowReceipt ? 200 : 180) * scaleFactor;
      const padding = 0;
      const fontSize = 14 * scaleFactor;
      const circleRadius = 3 * scaleFactor;
      const strokeWidth = 1 * scaleFactor;

      // Set SVG dimensions
      svg
        .attr('width', width + 2 * padding)
        .attr('height', height + 2 * padding);

      // Update all existing measurements with scaled values
      // Payment lines
      const paymentLines = svg
        .selectAll('line.payment-line')
        .data(sortedPaymentData)
        .enter()
        .append('line')
        .attr('class', 'payment-line')
        .attr(
          'x1',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y1', padding + height / 2 - 55 * scaleFactor)
        .attr(
          'x2',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y2', padding + height / 2 + 33) // Moved line end position down
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5, 5')
        .attr('stroke', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'var(--Accent-Color)';
          if (isAfter(d.Day, today) && subDays(d.Day, 10) <= today)
            return 'var(--Primary-Color)';
          return 'blue';
        });

      // Draw progress bar background
      svg
        .append('rect')
        .attr('x', padding)
        .attr('y', padding + height / 2 - 35 * scaleFactor)
        .attr('width', width - 80 * scaleFactor)
        .attr('height', 10 * scaleFactor)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#aaa')
        .attr('stroke-width', '1');

      // Draw current date indicator
      const calculateCurrentDatePosition = (
        sortedPayments: any[],
        width: number,
        padding: number
      ) => {
        const today = new Date().getTime();
        const firstPayment = sortedPayments[0].Day;
        const lastPayment = sortedPayments[sortedPayments.length - 1].Day;
        const totalTimespan = lastPayment - firstPayment;

        // Find the nearest payment dates before and after today
        const beforeToday =
          sortedPayments.filter((p) => p.Day <= today).slice(-1)[0]?.Day ||
          firstPayment;
        const afterToday =
          sortedPayments.find((p) => p.Day > today)?.Day || lastPayment;

        // Calculate position based on nearest payment points
        const segmentWidth = width / (sortedPayments.length - 1);
        const beforeIndex = sortedPayments.findIndex(
          (p) => p.Day === beforeToday
        );
        const afterIndex = sortedPayments.findIndex(
          (p) => p.Day === afterToday
        );

        const segmentProgress =
          (today - beforeToday) / (afterToday - beforeToday);
        const position =
          padding + (beforeIndex + segmentProgress) * segmentWidth;

        return Math.min(Math.max(position, padding), width - padding);
      };

      const currentDateX = calculateCurrentDatePosition(
        sortedPaymentData,
        width - 80 * scaleFactor,
        padding
      );
      // Draw progress bar background until the current date indicator
      svg
        .append('rect')
        .attr('x', padding)
        .attr('y', padding + height / 2 - 35 * scaleFactor)
        .attr('width', currentDateX + 36 * scaleFactor)
        .attr('height', 10 * scaleFactor)
        .attr('fill', 'var(--Secondary-Color)')
        .attr('stroke', 'var(--Secondary-Color)')
        .attr('stroke-width', '1');

      svg
        .append('line')
        .attr('x1', currentDateX + 36.3 * scaleFactor)
        .attr('y1', padding + height / 2 - 40 * scaleFactor)
        .attr('x2', currentDateX + 36.3 * scaleFactor)
        .attr('y2', padding + height / 2 - 18 * scaleFactor)
        .attr('stroke', '#00e1f1')
        .attr('stroke-width', '5')
        .each(function () {
          currentDateRef.current = this; // Attach the ref here
        });

      svg
        .append('text')
        .attr('x', currentDateX + 36.5 * scaleFactor)
        .attr('y', padding + height / 2 - 3 * scaleFactor)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--Text-Color)')
        .style('font-size', `${fontSize}px`)
        .text(format(today, 'MMMM d'));

      // Draw payment dates
      const paymentDates = svg
        .selectAll('text.payment-date')
        .data(sortedPaymentData)
        .enter()
        .append('text')
        .attr('class', 'payment-date')
        .style('fill', 'var(--Text-Color)')
        .style('font-size', `${fontSize}px`)
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y', padding + height / 2 - 75 * scaleFactor)
        .attr('text-anchor', 'middle')
        .text((d: { Day: number }) => format(d.Day, 'MMM d'));

      const paymentDates1 = svg
        .selectAll('text.payment-date1')
        .data(sortedPaymentData)
        .enter()
        .append('text')
        .attr('class', 'payment-date')
        .style('fill', 'var(--Text-Color)')
        .style('font-size', `${fontSize}px`)
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y', padding + height / 2 - 62 * scaleFactor)
        .attr('text-anchor', 'middle')
        .text((d: { Day: number }) => format(d.Day, 'yyyy'));

      // Draw payment circles
      const paymentCircles = svg
        .selectAll('circle.payment-circle')
        .data(sortedPaymentData)
        .enter()
        .append('circle')
        .attr('class', 'payment-circle')
        .attr(
          'cx',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('cy', padding + height / 2 - 30 * scaleFactor)
        .attr('r', circleRadius)
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'var(--Accent-Color)';
          if (isAfter(d.Day, today) && subDays(d.Day, 10) <= today)
            return 'var(--Secondary-Color)';
          return 'blue';
        });

      // Draw pay buttons using D3 elements aligned under each payment section
      const payButtons = svg
        .selectAll('text.pay-button')
        .data(sortedPaymentData)
        .enter()
        .append('text')
        .attr('class', 'pay-button')
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y', padding + height / 2 + 45 * scaleFactor)
        .attr('text-anchor', 'middle')
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'var(--Accent-Color)';

          return 'var(--Text-Color)';
        })
        .style('font-size', `${fontSize}px`)
        .style('cursor', 'pointer')
        .text((d: { Paid: boolean }) => (d.Paid ? 'Paid' : 'Pay'))
        .on('click', (event, d) => handlePayClick(d))
        .on('mouseover', function (event, d) {
          // Create tooltip
          svg
            .append('text')
            .attr('class', 'price-tooltip')
            .attr('x', d3.pointer(event)[0])
            .attr('y', d3.pointer(event)[1] - 10)
            .attr('text-anchor', 'middle')
            .style('zIndex', '1000')
            .style('fill', 'var(--Text-Color)')
            .style('font-size', `${fontSize + 10}px`)
            .text(`${d.Value.toLocaleString()} ${Currency}`);
        })
        .on('mouseout', function () {
          // Remove tooltip
          svg.selectAll('.price-tooltip').remove();
        });
      
      const selectButtons = svg
        .selectAll('rect.select-button')
        .data(sortedPaymentData)
        .enter()
        .append('rect')
        .attr('class', 'select-button')
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2 + 5 * scaleFactor
        )
        .attr('y', padding + height / 2 - 55 * scaleFactor)
        .attr('width', 10 * scaleFactor)
        .attr('height', 10 * scaleFactor)
        .attr('fill', (d: { Day: number }) =>
          selectedDates.includes(d.Day) ? 'var(--Accent-Color)' : 'transparent'
        )
        .attr('stroke', 'var(--Text-Color)')
        .attr('stroke-width', '1')
        .style('cursor', 'pointer')
        .style('opacity', '1')
        .on('click', (event: any, d: any) => {
          // Toggle selection of the date
          if (selectedDates.includes(d.Day)) {
            setSelectedDates(selectedDates.filter((date) => date !== d.Day));
          } else {
            setSelectedDates([...selectedDates, d.Day]);
          }
        });

      svg.on('mouseover', () => {
        selectButtons.style('opacity', '1');
      });

      svg.on('mouseout', () => {
        if (selectedDates.length <= 1) {
          selectButtons.style('opacity', '0');
        }
      });

      // Initial visibility check
      if (selectedDates.length > 1) {
        selectButtons.style('opacity', '1');
      }
      const payButtons2 = svg
        .selectAll('text2.pay-button')
        .data(sortedPaymentData)
        .enter()
        .append('text')
        .attr('class', 'pay-button')
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y', padding + height / 2 + 60 * scaleFactor)
        .attr('text-anchor', 'middle')
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'var(--Accent-Color)';
          return 'var(--Text-Color)';
        })
        .style('font-size', `${fontSize}px`)
        .append('tspan')
        .style('font-size', `${fontSize - 3}px`)
        .text((d: any) => CurrencySign(Currency))
        .append('tspan')
        .style('font-size', `${fontSize}px`)
        .text((d: any) => {
          return d.Value === null
            ? `${formatNumberWithSuffix(agreedPrice.toLocaleString())} X`
            : `${formatNumberWithSuffix(d.Value.toLocaleString())} X`;
        })
        .on('click', (event, d) => handlePayClick(d));
      /////////////////////////////////////////////
      if (ShowReceipt) {
        let currentContextData: any;
        const receiptGroup = svg
          .selectAll('g.receipt-group')
          .data(sortedPaymentData)
          .enter()
          .append('g')
          .attr('class', 'receipt-group');

        receiptGroup
          .append('rect')
          .attr('width', 35 * scaleFactor)
          .attr('height', 35 * scaleFactor)
          .attr(
            'x',
            (d: { Day: number }, i: number) =>
              padding + i * paymentWidth + paymentWidth / 2 - 17 * scaleFactor
          )
          .attr('y', padding + height / 2 + 65 * scaleFactor)
          .attr('fill', 'none')
          .attr('stroke', 'var(--Text-Color)')
          .attr('stroke-width', 1 * scaleFactor);
        const contextMenuGroup = svg
          .append('g')
          .attr('class', 'context-menu-group')
          .style('display', 'none');

        contextMenuGroup
          .append('rect')
          .attr('width', 120 * scaleFactor)
          .attr('height', window.electron ? 70 * scaleFactor : 50 * scaleFactor)
          .attr('fill', 'var(--Secondary-Color)')
          .attr('stroke', 'var(--Text-Color)');

        const menuItems = [window.electron ?'Open' : "Download", 'Delete',window.electron && 'File explorer' ];
        contextMenuGroup
          .selectAll('.menu-item')
          .data(menuItems)
          .enter()
          .append('text')
          .attr('class', 'menu-item')
          .attr('fill', 'var(--Text-Color)')

          .attr('x', 5 * scaleFactor)
          .attr('y', (d, i) => 20 * scaleFactor + i * 20 * scaleFactor)
          .text((d) => d);

        receiptGroup
          .append('foreignObject')
          .attr('width', 34 * scaleFactor)
          .attr('height', 34 * scaleFactor)
          .attr(
            'x',
            (d: { Day: number }, i: number) =>
              padding + i * paymentWidth + paymentWidth / 2 - 17 * scaleFactor
          )
          .attr('y', padding + height / 2 + 65 * scaleFactor)
          .append('xhtml:div')
          .style('width', '100%')
          .style('height', '100%')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('font-size', 'var(--10px-V)')
          .style('text-align', 'center')
          .html((d: any) => {
            // Return a placeholder initially
            return '<div class="receipt-placeholder">Loading...</div>';
          })
          .each(function (d: any) {
            const element = d3.select(this);
            GetReceiptFile(d.Day).then((receiptFile) => {
            
              if (!receiptFile || receiptFile==='Add receipt' || receiptFile==='COMUNDEFINED') {
                element.html('Add receipt');
                return;
              }

              const extension = receiptFile.split('.').pop().toLowerCase();
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(
                extension
              );

              let content = '';
              if (isImage) {
                content = `<img src="${receiptFile}" width="40" height="40" title="Click to open" />`;
              } else {
                content = `<div style="font-weight: bold;">${extension.toUpperCase()}</div>`;
              }

              element.html(`
                <div style="position: relative; width: 100%; height: 100%; background-color: grey;">
                  ${content}
                  
                </div>
              `);

              element.on('mouseover', function () {
                element.select('.hover-text').style('display', 'flex');
              });

              element.on('mouseout', function () {
                element.select('.hover-text').style('display', 'none');
              });
            });
          })
          .on('click', async function (event: Event, d: any) {
            const receiptFile = await GetReceiptFile(d.Day);
            if (!receiptFile || receiptFile==='Add receipt'||receiptFile==='COMUNDEFINED') {
              AddAReceipt(d);
              console.log('Add receipt');
            } else {
              openInPhotos(d);
            }
          })
          .on('contextmenu', async function (event: Event, d: any) {
            event.preventDefault();
            const receiptFile = await GetReceiptFile(d.Day);
            if(receiptFile==='Add receipt'||receiptFile==='COMUNDEFINED'){
              return;
            }
            if (!receiptFile || receiptFile==='Add receipt') {
              // If there's no receipt, don't show the context menu
              return;
            }

            currentContextData = d;
            const [x, y] = d3.pointer(event, svg.node());
            const svgBounds = svg.node()?.getBoundingClientRect();
            const menuHeight = 100 * scaleFactor; // Adjust based on your menu's actual height
            const menuWidth = 120 * scaleFactor; // Adjust based on your menu's actual width

            let menuX = x;
            let menuY = y;

            // Adjust vertical position if needed
            if (svgBounds && y + menuHeight > svgBounds.height) {
              menuY = y - menuHeight;
            }

            // Adjust horizontal position if needed
            if (svgBounds && x + menuWidth > svgBounds.width) {
              menuX = svgBounds.width - menuWidth;
            }

            contextMenuGroup
              .attr('transform', `translate(${menuX},${menuY})`)
              .style('display', 'block');

            // Close menu when clicking outside
            d3.select('body').on('click.context-menu', () => {
              contextMenuGroup.style('display', 'none');
              d3.select('body').on('click.context-menu', null);
            });
          });

        // Event listeners for menu items
        contextMenuGroup
          .selectAll('.menu-item')
          .on('click', function (event: Event) {
            const action = d3.select(this).text();
            switch (action) {
              case 'Open':
              case 'Download':
                openInPhotos(currentContextData);
                break;
              case 'File explorer':
                openInFileExplorer(currentContextData);
                break;

              case 'Delete':
                
                deleteReceipt(currentContextData.Day);
                break;
            }
            contextMenuGroup.style('display', 'none');
          });

        function GetReceiptFile(date: Date) {
          console.log(tenantList)
          return window.electron
            ? window.electron.ipcRenderer.invoke(
                'GetReceiptFile',
                date,
                roomType.id,
                tenantList.find((t: tenant) => t.id === roomType.tenantId)
              )
            : GetReceiptFileApi(date, roomType.id, tenantList.find((t: tenant) => t.id === roomType.tenantId));
        }

       
        function AddAReceipt(d: any) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,.pdf,.doc,.docx,.txt';

          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files[0];
            if (file) {
              const totalFileSizeMB = file.size / (1024 * 1024);
              const maxFileSizeMB = 5; // 5MB limit

              if (totalFileSizeMB > maxFileSizeMB) {
                showAlert(`File size exceeds the ${maxFileSizeMB}MB limit.`);
                return;
              }

              try {
                const roomId = roomType.id;
                const tenantId = roomType.tenantId || '';
                const tenantName =
                  tenantList.find((t: tenant) => t.id === tenantId)?.name ||
                  '';
                const formattedDate = format(d.Day, 'yyyy-MM-dd');
                const AddedTimeText = format(
                  new Date(
                    tenantList.find((t: tenant) => t.id === tenantId)
                      ?.startTime || 0
                  ),
                  'EEE MMM dd yyyy'
                );

                const results = window.electron ? await uploadReceiptDocuments(
                  [file],
                  roomId,
                  tenantName,
                  tenantId,
                  formattedDate,
                  AddedTimeText
                ) : await uploadReceiptDocumentsOnline(
                  file,
                  roomId,
                  tenantList,
                  tenantId,
                  formattedDate,AddedTimeText
                );

                if (results) {
                  console.log('Receipt uploaded successfully:', results);
                  refresh(); // Assuming you have a refresh function to update the UI
                } else {
                  console.error('Failed to upload receipt');
                }
              } catch (error) {
                console.error('Error uploading file:', error);
              }
            }
          };

          input.click();
        }

        async function openInPhotos(d: any) {
          try {
            if (window.electron) {
              // Electron version
              const receiptFile = await GetReceiptFile(d.Day);
              if (receiptFile) {
                window.electron.ipcRenderer.send('open-document', receiptFile);
              }
            } else {
              // Web version
              const receiptFile = await GetReceiptFile(
                d.Day,
              
              );
              
              if (receiptFile && receiptFile !== 'Add receipt') {
                // Open in new tab
                window.open(receiptFile, '_blank');
              } else {
                showAlert('error', 'No receipt found');
              }
            }
          } catch (error) {
            console.error('Error opening receipt:', error);
            showAlert('error', 'Failed to open receipt');
          }
        }

        async function openInFileExplorer(d: any) {
          const receiptFile = await GetReceiptFile(d.Day);
          if (receiptFile) {
            window.electron.ipcRenderer.send(
              'show-item-in-folder',
              receiptFile
            );
          }
          console.log('Open in file explorer');
        }
        async function deleteReceipt (date: number) {
          const choice = await confirm('Are you sure you want to delete this receipt?', {
            title: 'Delete receipt',
            confirmText: 'Delete',
            cancelText:'Cancel',
            type:'danger'
          });
          if(choice) {
          GetReceiptFile(date).then((receiptFile) => {
            if (receiptFile) {
              if(window.electron){
              window.electron.ipcRenderer.send('delete-receipt', receiptFile);
              window.electron.ipcRenderer.once(
                'receipt-deleted',
                (result: any) => {
                  if (result.success) {
                    console.log('Receipt deleted successfully');
                    refresh(); // Refresh the UI
                  } else {
                    console.error('Failed to delete receipt:', result.error);
                  }
                }
              );} else {
                deleteReceipt2(date,roomType.id,tenantList.find((t: tenant) => t.id === roomType.tenantId))
                refresh(); // Refresh the UI
              }
            }
          });}
        }
      }
      /////////////////////////////////////////////
      paymentCircles.on('click', (event: any, d: any) => {
        const updatedData = sortedPaymentData.map((item) => {
          if (item.Day === d.Day) {
            return { ...item, Paid: true };
          }
          return item;
        });
        roomPaymentInfoApi.editRoomPaymentApi(
          d.id,
          'Paid',
          1,
          roomType.id,
          roomType.AllRoomPayInfo.RoomPayInfo
        );
      });

      // Add extend button at the end of the progress bar
      if (
        tenantList.find((t: tenant) => t.id === roomType.tenantId)
          ?.SelectedAgreement === 'Open-Ended'
      ) {
        svg
          .append('rect')
          .attr('x', width + padding - 70 * scaleFactor)
          .attr('y', padding + height / 2 - 44 * scaleFactor)
          .attr('width', 60 * scaleFactor)
          .attr('height', 30 * scaleFactor)
          .attr('rx', 5 * scaleFactor)
          .attr('ry', 5 * scaleFactor)
          .attr('fill', 'var(--Secondary-Color)')
          .style('cursor', 'pointer')
          .on('click', () => {
            extendPaymentSchedule();
            refresh();
          });

        svg
          .append('text')
          .attr('x', width + padding - 40 * scaleFactor)
          .attr('y', padding + height / 2 - 29 * scaleFactor)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'lab(100 0 -0.03)')
          .style('font-size', '14 * scaleFactor')
          .style('cursor', 'pointer')
          .text('Extend?')
          .on('click', () => {
            extendPaymentSchedule();
            refresh();
          });
      }
    }
  }, [payments, today, windowWidth]);
  // Function to handle multi-pay

  const handleMultiPay = async () => {
    for (const date of selectedDates) {
      const payment = payments.find((item) => item.Day === date);
      if (payment && !payment.Paid) {
        await handlePayClick(payment);
      }
    }
    setSelectedDates([]);
  };

  const handleMultiUnPay = async () => {
    for (const date of selectedDates) {
      const payment = payments.find((item) => item.Day === date);
      if (payment && payment.Paid) {
        const existingPayment = AllRoomPayInfo.find(
          (p) => p.id === payment.id
        );
        if (existingPayment) {
          await updateValue(
            'room_pay_info',
            payment.id,
            'Paid',
            0,
            setChangeMade,
            0
          );
          setAllRoomPayInfo((prevInfo) =>
            prevInfo.map((p) =>
              p.id === payment.id ? { ...p, Paid: 0 } : p
            )
          );
          setPayments((prevPayments) =>
            prevPayments.map((p) =>
              p.id === payment.id ? { ...p, Paid: false } : p
            )
          );
        }
      }
    }
    setSelectedDates([]);
  };

  // Calculate days until or past due date for paragraph message
  const dueDate = payments.find((payment) => !payment.Paid)?.Day;
  const daysDifference = dueDate
    ? differenceInDays(new Date(dueDate), new Date(today))
    : undefined;

  const message =
    daysDifference !== undefined
      ? daysDifference > 0
        ? `Due in ${daysDifference + 1} day${
            daysDifference + 1 !== 1 ? 's' : ''
          }. Earnings: ${formatNumberWithSuffix(
            (
              agreedPrice * payments.filter((payment) => payment.Paid).length
            ).toLocaleString()
          )}. ${payments.filter((payment) => payment.Paid).length} payments.`
        : `Payment is past due by ${Math.abs(daysDifference)} days.`
      : payments.length > 0
      ? 'All payments are up to date.'
      : 'No payment information available.';
  const scrollToCurrentDate = () => {
    if (currentDateRef.current && svgRef.current) {
      const parentDiv = svgRef.current.parentElement;
      if (parentDiv) {
        const indicatorPosition =
          currentDateRef.current.getBoundingClientRect().left;
        const parentPosition = parentDiv.getBoundingClientRect().left;
        const scrollOffset = indicatorPosition - parentPosition;

        // Adjust the scrollOffset to scroll a bit more to the left
        const additionalOffset = 50; // Adjust this value as needed
        parentDiv.scrollLeft += scrollOffset - additionalOffset;
      }
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <p
          ref={paragraphRef}
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: 'var(--10px-V)',
            display: 'flex',
          }}
        >
          {message}
        </p>
        <button
          onClick={() => {
            refresh();
          }}
        >
          refresh
        </button>{' '}
        <button
          onClick={() => {
            setShowReceipt(!ShowReceipt);
            setShowUtilityPanel(!ShowReceipt);
          }}
        >
          RCT
        </button>
        <button onClick={scrollToCurrentDate}>Current Date</button>
        {selectedDates.length > 0 ? (
          <>
            {' '}
            <button
              onClick={() => {
                handleMultiUnPay();
              }}
            >
              UnPay
            </button>
            <button
              onClick={() => {
                handleMultiPay();
              }}
            >
              Pay
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
      <div
        style={{
          overflowX: 'auto',
          maxWidth: '100%',
          overflowY: 'hidden',
          height: ShowReceipt ? 'var(--220px-V)' : 'var(--174px-V)',
          transition: 'all .2s',
        }}
      >
        {' '}
        <svg ref={svgRef} width="100%" height="126" />
      </div>
    </div>
  );
};

export default React.memo(PaymentProgressBarGUI);

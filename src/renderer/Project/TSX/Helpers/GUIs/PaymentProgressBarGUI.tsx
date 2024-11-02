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
  getValuesWithSql,
  updateValue,
  uploadReceiptDocuments,
} from 'Backend/localServerApis';
import UtilityPanel from './UtilityPanel';
import { Payment } from 'electron';
export type RoomPayInfo = {
  Day: number; // milliseconds since January 1, 1970, 00:00:00 UTC
  Paid: boolean;
};

interface Props {
  paymentData: RoomPayInfo[];//
  agreedPrice: number;//
  roomType: RoomType;//
  tenantList: tenant[];//
  roomPaymentInfoApi: any;
  refresh: () => void;//
  extendPaymentSchedule: () => void;//
  ShowReceipt: boolean;//
  setShowReceipt: React.Dispatch<React.SetStateAction<boolean>>;//
  setChangeMade: any;
  SelectedUserId: string;
  updateRoomPropertyLocal: any;
}
const { v4: uuidv4 } = require('uuid');

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
}) => {
  const today = new Date().getTime();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const [selectedDates, setSelectedDates] = useState<number[]>([]); // State to track selected dates
  const currentDateRef = useRef<SVGLineElement | null>(null);

  const [showUtilityPanel, setShowUtilityPanel] = useState(false);
  const [payments, setPayments] = useState<RoomPayInfo[]>([]);
  useEffect(() => {
    const calculatePayments = async () => {
      const newPayments: Payment[] = [];
      let startDate =
        tenantList.find((tenant) => tenant.id === roomType.tenantId)
          ?.startTime || Date.now();
      let endDate = null;
      if (roomType.selectedAgreementId) {
        const agreements = await getValuesWithSql(
          'agreements',
          `WHERE id = '${roomType.selectedAgreementId}'`
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
      const existingPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${roomType.id}' AND tenantId = '${roomType.tenantId}'`
      );
      let tenantIsFixedTerm = tenantList.find((t: tenant) => t.id === roomType.tenantId)?.SelectedAgreement === 'Fixed-Term';
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
        }
      }

      return newPayments;
    };

    calculatePayments().then(setPayments);
  }, [roomType, tenantList]);
  const calculatePredictedPayments = async (room: RoomType) => {
    const allPayments = [];
    const today = new Date();
    const yearEnd = new Date(today.getFullYear() + 1, 11, 31);
    const tenant = await getValuesWithSql(
      'tenants',
      `WHERE id = '${room.tenantId}'`
    );
    let startDate = new Date(tenant[0]?.startTime || Date.now()).getTime();

    let endDate = null;
    if (room.selectedAgreementId) {
      const agreements = await getValuesWithSql(
        'agreements',
        `WHERE id = '${room.selectedAgreementId}'`
      );
      if (agreements.length > 0) {
        startDate = agreements[0].startTime;
      }
      if (tenant[0]?.SelectedAgreement === 'Fixed-Term') {
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

    const actualPayments = await getValuesWithSql(
      'room_pay_info',
      `WHERE roomId = '${room.id}' AND tenantId = '${room.tenantId}'`
    );

    const finalPayments = allPayments.map((payment) => {
      const actualPayment = actualPayments.find(
        (p: any) => p.id === payment.id
      );
      return actualPayment
        ? { ...payment, Paid: actualPayment.Paid === 1 }
        : payment;
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
  const handlePayClick = async (payment: RoomPayInfo) => {
    const existingPayment = await getValuesWithSql(
      'room_pay_info',
      `WHERE id = '${payment.id}'`
    );
    const newPaidStatus = !payment.Paid;
    if (existingPayment.length > 0) {
      if (newPaidStatus) {
        await updateValue(
          'room_pay_info',
          payment.id,
          'Paid',
          1,
          setChangeMade,
          0
        );
      } else {
        await deleteValue('room_pay_info', payment.id, setChangeMade);
      }
    } else if (newPaidStatus) {
      await addValue(
        'room_pay_info',
        {
          ...payment,
          Paid: 1,
          roomId: roomType.id,
          tenantId: roomType.tenantId,
        },
        setChangeMade
      );
    }

    setPayments((prevPayments) =>
      prevPayments.map((p) =>
        p.id === payment.id ? { ...p, Paid: newPaidStatus } : p
      )
    );
    updateRoomPropertyLocal(
      roomType.id,
      'DaysTillNextPayment',
      calculateDaysTillNextPayment(await calculatePredictedPayments(roomType))
    );
  };
  useEffect(() => {
    if (payments.length > 0 && svgRef.current) {
      const sortedPaymentData = [...payments].sort((a, b) => a.Day - b.Day);
      const svg = d3.select(svgRef.current);

      // Clear existing SVG content
      svg.selectAll('*').remove();

      // Calculate the width and height based on the number of payments
      const paymentWidth = 75; // Width of each payment section
      const width = sortedPaymentData.length * paymentWidth + 70; // Total width based on number of payments
      const height = ShowReceipt ? 200 : 180; // Increased height to accommodate dates
      const padding = 0;

      // Set SVG dimensions
      svg
        .attr('width', width + 2 * padding)
        .attr('height', height + 2 * padding);

      // Draw payment lines
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
        .attr('y1', padding + height / 2 - 55) // Moved line start position up
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
        .attr('y', padding + height / 2 - 35)
        .attr('width', width - 80)
        .attr('height', 10)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#aaa')
        .attr('stroke-width', '1');

      // Draw current date indicator
      const calculateCurrentDatePosition = (sortedPayments: any[], width: number, padding: number) => {
        const today = new Date().getTime();
        const firstPayment = sortedPayments[0].Day;
        const lastPayment = sortedPayments[sortedPayments.length - 1].Day;
        const totalTimespan = lastPayment - firstPayment;
        
        // Find the nearest payment dates before and after today
        const beforeToday = sortedPayments.filter(p => p.Day <= today).slice(-1)[0]?.Day || firstPayment;
        const afterToday = sortedPayments.find(p => p.Day > today)?.Day || lastPayment;
        
        // Calculate position based on nearest payment points
        const segmentWidth = width / (sortedPayments.length - 1);
        const beforeIndex = sortedPayments.findIndex(p => p.Day === beforeToday);
        const afterIndex = sortedPayments.findIndex(p => p.Day === afterToday);
        
        const segmentProgress = (today - beforeToday) / (afterToday - beforeToday);
        const position = padding + (beforeIndex + segmentProgress) * segmentWidth;
        
        return Math.min(Math.max(position, padding), width - padding);
      };

      const currentDateX = calculateCurrentDatePosition(sortedPaymentData, width - 80, padding);
 // Draw progress bar background until the current date indicator
 svg
 .append('rect')
 .attr('x', padding)
 .attr('y', padding + height / 2 - 35)
 .attr('width', currentDateX + 36)
 .attr('height', 10)
 .attr('fill', 'var(--Secondary-Color)')
        .attr('stroke', 'var(--Secondary-Color)')
        .attr('stroke-width', '1');

      svg
        .append('line')
        .attr('x1', currentDateX + 36.3)
        .attr('y1', padding + height / 2 - 40)
        .attr('x2', currentDateX + 36.3)
        .attr('y2', padding + height / 2 - 18)
        .attr('stroke', '#00e1f1')
        .attr('stroke-width', '5')
        .each(function() {
          currentDateRef.current = this; // Attach the ref here
        });

      
        svg
        .append('text')
        .attr('x', currentDateX + 36.5)
        .attr('y', padding + height / 2 - 3)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--Text-Color)')
        .style('font-size', '14')
        .text(format(today, 'MMMM d'));

      // Draw payment dates
      const paymentDates = svg
        .selectAll('text.payment-date')
        .data(sortedPaymentData)
        .enter()
        .append('text')
        .attr('class', 'payment-date')
        .style('fill', 'var(--Text-Color)')
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y', padding + height / 2 - 75) // Moved dates above the progress bar
        .attr('text-anchor', 'middle')
        .text((d: { Day: number }) => format(d.Day, 'MMM d'));

      const paymentDates1 = svg
        .selectAll('text.payment-date1')
        .data(sortedPaymentData)
        .enter()
        .append('text')
        .attr('class', 'payment-date')
        .style('fill', 'var(--Text-Color)')
        .style('font-size', '10')
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2
        )
        .attr('y', padding + height / 2 - 62) // Moved dates above the progress bar
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
        .attr('cy', padding + height / 2 - 30) // Moved circles below the progress bar
        .attr('r', 3)
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
        .attr('y', padding + height / 2 + 45) // Adjusted position below payment circles
        .attr('text-anchor', 'middle')
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'var(--Accent-Color)';

          return 'var(--Text-Color)';
        })
        .style('font-size', '14')
        .style('cursor', 'pointer')
        .text((d: { Paid: boolean }) => (d.Paid ? 'Paid' : 'Pay'))
        .on('click', (event, d) => handlePayClick(d));
      const selectButtons = svg
        .selectAll('rect.select-button')
        .data(sortedPaymentData)
        .enter()
        .append('rect')
        .attr('class', 'select-button')
        .attr(
          'x',
          (d: { Day: number }, i: number) =>
            padding + i * paymentWidth + paymentWidth / 2 + 5
        )
        .attr('y', padding + height / 2 - 55)
        .attr('width', 10)
        .attr('height', 10)
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
        .attr('y', padding + height / 2 + 60) // Adjusted position below payment circles
        .attr('text-anchor', 'middle')
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'var(--Accent-Color)';
          return 'var(--Text-Color)';
        })
        .style('font-size', '14')
        .text((d: any) => {
          return d.Value === null
            ? '$' + agreedPrice.toLocaleString() + ' X'
            : '$' + d.Value.toLocaleString() + ' X';
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
          .attr('width', 35)
          .attr('height', 35)
          .attr(
            'x',
            (d: { Day: number }, i: number) =>
              padding + i * paymentWidth + paymentWidth / 2 - 17
          )
          .attr('y', padding + height / 2 + 65)
          .attr('fill', 'none')
          .attr('stroke', 'var(--Text-Color)')
          .attr('stroke-width', 1);
        const contextMenuGroup = svg
          .append('g')
          .attr('class', 'context-menu-group')
          .style('display', 'none');

        contextMenuGroup
          .append('rect')
          .attr('width', 120)
          .attr('height', 70)
          .attr('fill', 'var(--Secondary-Color)')
          .attr('stroke', 'var(--Text-Color)');

        const menuItems = ['Open', 'File explorer', 'Delete'];
        contextMenuGroup
          .selectAll('.menu-item')
          .data(menuItems)
          .enter()
          .append('text')
          .attr('class', 'menu-item')
          .attr('fill', 'var(--Text-Color)')

          .attr('x', 5)
          .attr('y', (d, i) => 20 + i * 20)
          .text((d) => d);

        receiptGroup
          .append('foreignObject')
          .attr('width', 34)
          .attr('height', 34)
          .attr(
            'x',
            (d: { Day: number }, i: number) =>
              padding + i * paymentWidth + paymentWidth / 2 - 17
          )
          .attr('y', padding + height / 2 + 65)
          .append('xhtml:div')
          .style('width', '100%')
          .style('height', '100%')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('font-size', '10px')
          .style('text-align', 'center')
          .html((d: any) => {
            // Return a placeholder initially
            return '<div class="receipt-placeholder">Loading...</div>';
          })
          .each(function (d: any) {
            const element = d3.select(this);
            GetReceiptFile(d.Day).then((receiptFile) => {
              if (!receiptFile) {
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
            if (!receiptFile) {
              AddAReceipt(d);
              console.log('Add receipt');
            } else {
              openInPhotos(d);
            }
          })
          .on('contextmenu', async function (event: Event, d: any) {
            event.preventDefault();
            const receiptFile = await GetReceiptFile(d.Day);

            if (!receiptFile) {
              // If there's no receipt, don't show the context menu
              return;
            }

            currentContextData = d;
            const [x, y] = d3.pointer(event, svg.node());
            const svgBounds = svg.node()?.getBoundingClientRect();
            const menuHeight = 100; // Adjust based on your menu's actual height
            const menuWidth = 120; // Adjust based on your menu's actual width

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
          return window.electron.ipcRenderer.invoke(
            'GetReceiptFile',
            date,
            roomType.id,
            tenantList.find((t: tenant) => t.id === roomType.tenantId)
          );
        }
        // Unimplemented functions
        function AddAReceipt(d: any) {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'image/*,.pdf,.doc,.docx,.txt';

          input.onchange = async (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              const validFiles = Array.from(files).filter(
                (file) => file.size <= 5 * 1024 * 1024
              );

              if (validFiles.length !== files.length) {
                alert(
                  'Some files were skipped because they exceed the 5MB size limit.'
                );
              }

              if (validFiles.length > 0) {
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

                  const results = await uploadReceiptDocuments(
                    validFiles,
                    roomId,
                    tenantName,
                    tenantId,
                    formattedDate,
                    AddedTimeText
                  );

                  if (results) {
                    console.log('Receipts uploaded successfully:', results);
                    refresh(); // Assuming you have a refresh function to update the UI
                  } else {
                    console.error('Failed to upload receipts');
                  }
                } catch (error) {
                  console.error('Error uploading files:', error);
                }
              } else {
                alert(
                  'No valid files selected. Please choose files under 5MB in size.'
                );
              }
            }
          };

          input.click();
        }

        async function openInPhotos(d: any) {
          console.log('Open in photos', d);
          const receiptFile = await GetReceiptFile(d.Day);
          if (receiptFile) {
            window.electron.ipcRenderer.send('open-document', receiptFile);
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
        function deleteReceipt(date: number) {
          GetReceiptFile(date).then((receiptFile) => {
            if (receiptFile) {
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
              );
            }
          });
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
          .attr('x', width + padding - 70)
          .attr('y', padding + height / 2 - 44)
          .attr('width', 60)
          .attr('height', 30)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('fill', 'var(--Secondary-Color)')
          .style('cursor', 'pointer')
          .on('click', () => {
            extendPaymentSchedule();
            refresh();
          });

        svg
          .append('text')
          .attr('x', width + padding - 40)
          .attr('y', padding + height / 2 - 29)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'lab(100 0 -0.03)')
          .style('font-size', '14')
          .style('cursor', 'pointer')
          .text('Extend?')
          .on('click', () => {
            extendPaymentSchedule();
            refresh();
          });
      }
    }
  }, [payments, today]);
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
        const existingPayment = await getValuesWithSql(
          'room_pay_info',
          `WHERE id = '${payment.id}'`
        );
        if (existingPayment.length > 0) {
          await updateValue(
            'room_pay_info',
            payment.id,
            'paid',
            0,
            setChangeMade,
            1
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
          }. Earnings: ${(
            agreedPrice * payments.filter((payment) => payment.Paid).length
          ).toLocaleString()}. ${
            payments.filter((payment) => payment.Paid).length
          } payments.`
        : `Payment is past due by ${Math.abs(daysDifference)} days.`
      : payments.length > 0
      ? 'All payments are up to date.'
      : 'No payment information available.';
      const scrollToCurrentDate = () => {
        if (currentDateRef.current && svgRef.current) {
          const parentDiv = svgRef.current.parentElement;
          if (parentDiv) {
            const indicatorPosition = currentDateRef.current.getBoundingClientRect().left;
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
            marginBottom: '10px',
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
          height: ShowReceipt ? '220px' : '174px',
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

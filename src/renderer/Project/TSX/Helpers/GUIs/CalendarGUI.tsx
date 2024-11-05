import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import '../../../CSS/Calendar.css';
import { addDays, addMonths, startOfYear, endOfYear, addYears } from 'date-fns';
import { getValuesWithSql } from 'Backend/localServerApis';

interface CalendarProps {
  rooms: RoomType[];
  initialMonths: number;
  initialMonthsPast: number;
  tenantList: tenant[];SelectedBranchId:any
}

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const CalendarGUI: React.FC<CalendarProps> = ({
  rooms,
  initialMonths,
  initialMonthsPast,
  tenantList,SelectedBranchId
}: CalendarProps) => {
  const [numberOfMonthsFuture, setNumberOfMonthsFuture] =
    useState(initialMonths);
  const [numberOfMonthsPast, setNumberOfMonthsPast] =
    useState(initialMonthsPast);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState(rooms);
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<SVGSVGElement | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getScaleFactor = () => {
    if (windowWidth <= 1280) return 1280 / 1920;
    if (windowWidth <= 1366) return 1366 / 1920;
    if (windowWidth >= 2560) return 3840 / 1920;
    return 1;
  };

  useEffect(() => {
    const filtered = rooms.filter((room) =>
      tenantList
        .find((tenant) => tenant.id === room.tenantId)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  }, [searchTerm, rooms, tenantList]);

  useEffect(() => {
    const makeTable = async () => {
      let load = true;
      const calculatePayments = async () => {
        setIsLoading(true);
        const allPayments: Payment[] = [];
        const currentYear = new Date().getFullYear();
        let yearStart = startOfYear(new Date(currentYear - 3, 0, 1));
        let yearEnd = endOfYear(new Date(currentYear + 3, 11, 31));

        // Get all actual payments for the selected years
        const actualPayments = await getValuesWithSql(
          'room_pay_info',
          `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
        );

        // Get historical payments
        const historicalPayments = await getValuesWithSql(
          'room_pay_info_history',
          `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
        );

        // Combine actual and historical payments
        const combinedPayments = [...actualPayments, ...historicalPayments];

        // Process all combined payments
        combinedPayments.forEach((payment) => {
          allPayments.push({
            id: payment.id,
            Day: payment.Day,
            Value: payment.Value,
            Paid: payment.Paid === 1,
            roomId: payment.roomId,
          });
        });

        // Generate predicted payments only for future dates or missing payments
        for (const room of rooms) {
          let startDate = new Date(
            tenantList.find((tenant) => tenant.id === room.tenantId)
              ?.startTime || Date.now()
          ).getTime();
          let endDate = yearEnd.getTime();
          if (room.selectedAgreementId) {
            const agreements = await getValuesWithSql(
              'agreements',
              `WHERE id = '${room.selectedAgreementId}'`
            );
            if (agreements.length > 0) {
              startDate = Math.max(
                agreements[0].startTime,
                yearStart.getTime()
              );
              if (
                tenantList.find((t: tenant) => t.id === room.tenantId)
                  ?.SelectedAgreement === 'Fixed-Term' &&
                agreements[0].endTime
              ) {
                endDate = Math.min(agreements[0].endTime, yearEnd.getTime());
              }
            }
          }

          let currentDate = new Date(startDate);

          while (currentDate.getTime() <= endDate) {
            const paymentId = `${room.id}-${currentDate.getTime()}`;
            const existingPayment = allPayments.find((p) => p.id === paymentId);

            if (!existingPayment) {
              allPayments.push({
                id: paymentId,
                Day: currentDate.getTime(),
                Value: room.AgreedPrice,
                Paid: false,
                roomId: room.id,
              });
            }

            // Calculate next payment date based on payment cycle
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
        }

        setIsLoading(false);
        return allPayments;
      };
      const scaleFactor = getScaleFactor();

      const baseWidth = 1500 * scaleFactor;
      const additionalMonthWidth = 750 * scaleFactor;
      const width =
        baseWidth +
        (numberOfMonthsFuture + numberOfMonthsPast - 2) * additionalMonthWidth;
      const minimumHeight = 100;
      const calculatedHeight = filteredRooms.length * (70 * scaleFactor);
      const height = Math.max(minimumHeight, calculatedHeight);
      const cellSize = 25 * scaleFactor;
      const margin = {
        top: 70  ,
        right: 30 * 1,
        bottom: 30 * 1,
        left: 200 * 1,
      };

      if (ref.current) {
        d3.select(ref.current).selectAll('*').remove();

        const svg = d3
          .select(ref.current)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        const today = new Date();
        const startDate = d3.timeMonth.offset(today, -numberOfMonthsPast);
        const endDate = d3.timeMonth.offset(today, numberOfMonthsFuture);

        const xScale = d3
          .scaleTime()
          .domain([startDate, endDate])
          .range([0, width]);

        const yScale = d3
          .scaleBand()
          .domain(filteredRooms.map((room) => room.id))
          .range([0, height - 60])
          .padding(0.1);

        const xAxis = d3
          .axisTop(xScale)
          .ticks(d3.timeDay.every(1))
          .tickFormat((d: Date) => {
            const day = d3.timeFormat('%d')(d);
            return day;
          })
          .tickSizeOuter(0);

        const monthAxis = d3
          .axisTop(xScale)
          .ticks(d3.timeMonth.every(1))
          .tickFormat((d: Date) => {
            const monthStart = d3.timeMonth(d);
            const monthEnd = d3.timeMonth.offset(monthStart, 1);
            const monthCenter = new Date(
              (monthStart.getTime() + monthEnd.getTime()) / 2
            );
            if (monthCenter >= startDate && monthCenter <= endDate) {
              return d3.timeFormat(`%B ${monthCenter.getFullYear()}`)(d);
            }
            return '';
          })
          .tickSize(0);

        svg
          .append('g')
          .call(monthAxis)
          .attr('transform', `translate(0, ${-25})`)
          .selectAll('text')
          .style('font-size', `${15 * scaleFactor}px`);

        svg
          .append('g')
          .call(xAxis)
          .attr('transform', `translate(0, -3)`)
          .selectAll('text')
          .style('font-size', `${14 * scaleFactor}px`);

        const yAxis = d3
          .axisLeft(yScale)
          .tickFormat((d: string) => {
            const room = filteredRooms.find((room) => room.id === d);
            return room
              ? `${
                  tenantList.find((t: tenant) => t.id === room.tenantId)?.name
                }\n` +
                  `${room.AgreedPrice.toLocaleString()}$ - Floor. ${
                    room.floor
                  } Room. ${room.roomIndex}`
              : '';
          })
          .tickSize(10 * scaleFactor)
          .tickPadding(5 * scaleFactor);

        svg
          .append('g')
          .call(yAxis)
          .raise()
          .selectAll('.tick text')
          .call(function (text: any) {
            text.each(function (this: SVGTextElement) {
              var text = d3.select(this);
              var words = text.text().split('\n');
              text.text('');
              text
                .append('tspan')
                .attr('x', -10 * scaleFactor)
                .attr('dy', `-${0.5 * scaleFactor}em`)
                .style('font-size', `${14 * scaleFactor}px`)
                .text(words[0]);
              text
                .append('tspan')
                .attr('x', -15 * scaleFactor)
                .attr('dy', `${1.2 * scaleFactor}em`)
                .style('font-size', `${11.3 * scaleFactor}px`)
                .text(words[1]);

              var parentNode = this.parentNode;
              if (parentNode) {
                d3.select(parentNode)
                  .append('line')
                  .attr('x1', 0)
                  .attr('x2', -100 * scaleFactor)
                  .attr('y1', 15 * scaleFactor)
                  .attr('y2', 15 * scaleFactor)
                  .attr('stroke', '#DDDDDD')
                  .attr('stroke-width', 1 * scaleFactor);
              }
            });
          });

        svg
          .selectAll('.x-grid')
          .data(yScale.domain())
          .enter()
          .append('line')
          .attr('class', 'x-grid')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', (d: any) => yScale(d) - 5 * scaleFactor || 0)
          .attr('y2', (d: any) => yScale(d) - 5 * scaleFactor || 0)
          .attr('stroke', 'grey')
          .attr('stroke-width', 1 * scaleFactor);

        svg
          .selectAll('.x-grid-bottom')
          .data(yScale.domain())
          .enter()
          .append('line')
          .attr('class', 'x-grid-bottom')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', (d: any) => (yScale(d) || 0) + yScale.bandwidth())
          .attr('y2', (d: any) => (yScale(d) || 0) + yScale.bandwidth())
          .attr('stroke', 'grey');
        if (filteredRooms.length === 0) return;

        svg
          .selectAll('.y-grid')
          .data(xScale.ticks(d3.timeDay))
          .enter()
          .append('line')
          .attr('class', 'y-grid')
          .attr('x1', (d: any) => xScale(d))
          .attr('x2', (d: any) => xScale(d))
          .attr('y1', 0 - 0)
          .attr('y2', height - 62)
          .attr('stroke', 'grey');
        const currentDateRect = svg
          .append('rect')
          .attr('x', xScale(today))
          .attr('y', 0)
          .attr('width', 2 * scaleFactor)
          .attr('height', height - 62)
          .attr('fill', '#db911a');

        const currentdatehight =
          today.getDate() >= 26 || today.getDate() <= 6 ? 40  : 25;
        svg
          .append('text')
          .attr('x', xScale(today))
          .attr('y', -currentdatehight)
          .attr('text-anchor', 'middle')
          .attr('fill', '#db911a')
          .style('font-size', `${18 * scaleFactor}px`)
          .text(today.toDateString());

        const monthStarts = d3.timeMonths(startDate, endDate);
        svg
          .selectAll('.month-indicator')
          .data(monthStarts)
          .enter()
          .append('line')
          .attr('class', 'month-indicator')
          .attr('x1', (d: any) => xScale(d))
          .attr('x2', (d: any) => xScale(d))
          .attr('y1', -0)
          .attr('y2', height - 62)
          .attr('stroke', 'blue')
          .attr('stroke-width', 1 * scaleFactor);

        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('visibility', 'hidden')
          .style('background-color', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', `${10 * scaleFactor}px`)
          .style('border-radius', `${5 * scaleFactor}px`)
          .style('font-size', `${12 * scaleFactor}px`);

        // Add empty squares for all dates and rooms
        filteredRooms.forEach((room) => {
          const allDates = d3.timeDays(startDate, endDate);
          allDates.forEach((date) => {
            svg
              .append('rect')
              .attr('x', xScale(date) - 2)
              .attr('y', yScale(room.id) - 4)
              .attr('width', cellSize)
              .attr('height', yScale.bandwidth() + 4)
              .attr('fill', 'transparent')
              .attr('stroke', '#DDDDDD')
              .attr('stroke-width', 0)
              .on('mouseover', (event: MouseEvent) => {
                d3.select(event.target as SVGRectElement)
                  .attr('fill', '#f0f0f0')
                  .attr('opacity', 0.5);
              })
              .on('mouseout', (event: MouseEvent) => {
                d3.select(event.target as SVGRectElement)
                  .attr('fill', 'transparent')
                  .attr('opacity', 0);
              });
          });
        });

        filteredRooms.forEach(async (room) => {
          const roomPayments = await (
            await calculatePayments()
          ).filter((payment: Payment) => payment.roomId === room.id);
          roomPayments.forEach((payment) => {
            const paymentDate = new Date(payment.Day);

            if (paymentDate >= startDate && paymentDate <= endDate) {
              svg
                .append('rect')
                .attr('x', xScale(paymentDate) - 2)
                .attr('y', yScale(room.id) - 4)
                .attr('width', cellSize)
                .attr('height', yScale.bandwidth() + 4)
                .attr('fill', payment.Paid ? '#00e1ff' : 'red')
                .attr('opacity', 0.5)
                .on('mouseover', (event: MouseEvent, d: any) => {
                  const daysUntil = Math.ceil(
                    (paymentDate.getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  tooltip
                    .style('visibility', 'visible')
                    .html(
                      `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                      <h3 style="color: #4a4a4a; margin-bottom: var(--5px-V);">Room Details</h3>
                      <p><em>Date:</em> <span style="color: #0066cc;">${paymentDate.toDateString()}</span></p>
                      <p><strong style="font-size: 1.1em;">Tenant:</strong> ${
                        tenantList.find((t) => t.id === room.tenantId)?.name ||
                        'N/A'
                      }</p>
                      <p><i>Contact:</i> <span style="text-decoration: underline;">${
                        tenantList.find((t) => t.id === room.tenantId)
                          ?.phoneNumber || 'N/A'
                      }</span></p>
                      <p><strong>Status:</strong> ${
                        payment.Paid
                          ? '<span style="color: #00e1ff; ">Paid</span>'
                          : '<span style="color: red; font-weight: bold;">Unpaid</span>'
                      }</p>
                      <p><em style="font-style: italic;">Agreed Price:</em> <span style="font-weight: bold; color: #e67e22;">${payment.Value.toLocaleString()}$</span></p>
                      <p>Payment Cycle: <span style="background-color: #f1c40f; padding: var(--2px-V) var(--5px-V); border-radius: var(--3px-V);">${
                        room.PaymentCycleType
                      }</span></p>
                      <p style="font-size: 0.9em; color: #7f8c8d;">Days until payment: ${daysUntil}</p>
                    </div>
                  `
                    )
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 10 + 'px');
                  d3.select(event.target)
                    .attr('fill', payment.Paid ? '#00e1ff' : '#FF0000')
                    .attr('opacity', 0.8);
                })
                .on('mousemove', (event: MouseEvent) => {
                  tooltip
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 10 + 'px');
                })

                .on('mouseout', (event: MouseEvent) => {
                  tooltip.style('visibility', 'hidden');
                  d3.select(event.target)
                    .attr('fill', payment.Paid ? '#00e1ff' : 'red')
                    .attr('opacity', 0.5);
                });
            }
          });
        });
      }
    };
    makeTable();
  }, [
    filteredRooms,
    numberOfMonthsFuture,
    numberOfMonthsPast,
    tenantList,
    windowWidth,
  ]);

  const handleMonthsFutureChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    setNumberOfMonthsFuture(isNaN(value) ? initialMonths : Math.max(1, value));
  };

  const handleMonthsPastChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    setNumberOfMonthsPast(
      isNaN(value) ? initialMonthsPast : Math.max(1, value)
    );
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const scrollToCurrentDate = () => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      const currentDateRect = svg.select('rect[fill="#db911a"]');
      if (!currentDateRect.empty()) {
        const x = parseFloat(currentDateRect.attr('x'));
        const scrollContainer = ref.current.parentElement;
        if (scrollContainer) {
          scrollContainer.scrollLeft = x;
        }
      }
    }
  };
  return (
    <div className="CalenderContainer">
      <div className="CalanderMainContainer">
        <div className="CalenderOptionsMainContainer">
          <input
            type="text"
            placeholder="Search by tenant name"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              padding: 'var(--5px-V)',
              borderRadius: 'var(--3px-V)',
              border: 'var(--1px-V) solid #ccc',
            }}
          />

          <label htmlFor="monthsPastInput">Months to show in past: </label>
          <input
            id="monthsPastInput"
            type="number"
            min="1"
            value={numberOfMonthsPast}
            onChange={handleMonthsPastChange}
            style={{
              width: 'var(--50px-V)',
              padding: 'var(--5px-V)',
              borderRadius: 'var(--3px-V)',
              border: 'var(--1px-V) solid #ccc',
            }}
          />
          <label htmlFor="monthsFutureInput">Months to show in future: </label>
          <input
            id="monthsFutureInput"
            type="number"
            min="1"
            value={numberOfMonthsFuture}
            onChange={handleMonthsFutureChange}
            style={{
              width: 'var(--50px-V)',
              padding: 'var(--5px-V)',
              borderRadius: 'var(--3px-V)',
              border: 'var(--1px-V) solid #ccc',
            }}
          />
          <button
            onClick={scrollToCurrentDate}
            style={{
              padding: 'var(--5px-V) var(--10px-V)',
              backgroundColor: '#4CAF50',

              border: 'none',
              borderRadius: 'var(--3px-V)',
              cursor: 'pointer',
            }}
          >
            Go to Current Date
          </button>
        </div>
        <div
          style={{ overflowX: 'auto', height: 'calc(100% - var(--44px-V))' }}
        >
          <svg ref={ref}></svg>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CalendarGUI);

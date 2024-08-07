import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface CalendarProps {
  rooms: RoomType[];
  initialMonths: number;
  tenantList: tenant[];
}

const CalendarGUI: React.FC<CalendarProps> = ({
  rooms,
  initialMonths,
  tenantList,
}: CalendarProps) => {
  const [numberOfMonths, setNumberOfMonths] = useState(initialMonths);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState(rooms);
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const filtered = rooms.filter(room => 
      tenantList.find(tenant => tenant.id === room.tenantId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  }, [searchTerm, rooms, tenantList]);

  useEffect(() => {
    if (ref.current) {
      d3.select(ref.current).selectAll('*').remove();

      const baseWidth = 1500;
      const additionalMonthWidth = 750;
      const width = baseWidth + (numberOfMonths - 2) * additionalMonthWidth;
      const height = filteredRooms.length * 70;
      const cellSize = 20;
      const margin = { top: 70, right: 30, bottom: 30, left: 200 };

      const svg = d3
        .select(ref.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const today = new Date();
      const startDate = d3.timeDay.offset(today, -7);
      const endDate = d3.timeMonth.offset(today, numberOfMonths);

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
        .tickFormat(d3.timeFormat('%d'))
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
            return d3.timeFormat('%B')(d);
          }
          return '';
        })
        .tickSize(0);

      svg
        .append('g')
        .call(monthAxis)
        .attr('transform', `translate(0, -40)`)
        .style('font-size', '18px');
      svg.append('g').call(xAxis).attr('transform', `translate(0, -20)`);

      const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d: string) => {
          const room = filteredRooms.find((room) => room.id === d);
          return room
            ? `${
                tenantList.find((t: tenant) => t.id === room.tenantId).name
              }\n` +
                `${room.AgreedPrice.toLocaleString()}$ - Floor. ${
                  room.floor
                } Room. ${room.roomIndex}`
            : '';
        })
        .tickSize(10)
        .tickPadding(5);

      svg
        .append('g')
        .call(yAxis)
        .raise()
        .selectAll('.tick text')
        .call(function (text) {
          text.each(function () {
            var text = d3.select(this);
            var words = text.text().split('\n');
            text.text('');
            text
              .append('tspan')
              .attr('x', -10)
              .attr('dy', '-0.5em')
              .style('font-size', '14px')
              .text(words[0]);
            text
              .append('tspan')
              .attr('x', -15)
              .attr('dy', '1.2em')
              .style('font-size', '11.3px')
              .text(words[1]);

            var parentNode = this.parentNode;
            d3.select(parentNode)
              .append('line')
              .attr('x1', -0)
              .attr('x2', -100)
              .attr('y1', 15)
              .attr('y2', 15)
              .attr('stroke', '#DDDDDD')
              .attr('stroke-width', 1);
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
        .attr('y1', (d: any) => yScale(d) - 4 || 0)
        .attr('y2', (d: any) => yScale(d) - 4 || 0)
        .attr('stroke', '#DDDDDD80');

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
        .attr('stroke', '#DDDDDD70');

      svg
        .selectAll('.y-grid')
        .data(xScale.ticks(d3.timeDay))
        .enter()
        .append('line')
        .attr('class', 'y-grid')
        .attr('x1', (d: any) => xScale(d))
        .attr('x2', (d: any) => xScale(d))
        .attr('y1', 0 - 20)
        .attr('y2', height - 65)
        .attr('stroke', '#DDDDDD7F');

      const currentDateRect = svg
        .append('rect')
        .attr('x', xScale(today))
        .attr('y', 0 - 20)
        .attr('width', 2)
        .attr('height', height - 45)
        .attr('fill', 'yellow')
        .attr('opacity', 1);

      const monthStarts = d3.timeMonths(startDate, endDate);
      svg
        .selectAll('.month-indicator')
        .data(monthStarts)
        .enter()
        .append('line')
        .attr('class', 'month-indicator')
        .attr('x1', (d: any) => xScale(d))
        .attr('x2', (d: any) => xScale(d))
        .attr('y1', -20)
        .attr('y2', height - 65)
        .attr('stroke', 'lab(4.39 26.27 -47.05 / 0.32)')
        .attr('stroke-width', 1);

      const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '12px')
        .style('pointer-events', 'none');

      filteredRooms.forEach((room) => {
        room.AllRoomPayInfo.RoomPayInfo.forEach((payment) => {
          const paymentDate = new Date(payment.Day);

          if (paymentDate >= startDate && paymentDate <= endDate) {
            svg
              .append('rect')
              .attr('x', xScale(paymentDate) - 2)
              .attr('y', yScale(room.id) - 4)
              .attr('width', cellSize)
              .attr('height', yScale.bandwidth() + 4)
              .attr('fill', payment.Paid ? 'green' : 'red')
              .attr('opacity', 0.5)
              .on('mouseover', (event, d) => {
                const daysUntil = Math.ceil(
                  (paymentDate - new Date()) / (1000 * 60 * 60 * 24)
                );
                tooltip
                  .style('visibility', 'visible')
                  .html(
                    `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                      <h3 style="color: #4a4a4a; margin-bottom: 5px;">Room Details</h3>
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
                          ? '<span style="color: green; font-weight: bold;">Paid</span>'
                          : '<span style="color: red; font-weight: bold;">Unpaid</span>'
                      }</p>
                      <p><em style="font-style: italic;">Agreed Price:</em> <span style="font-weight: bold; color: #e67e22;">$${room.AgreedPrice.toLocaleString()}</span></p>
                      <p>Payment Cycle: <span style="background-color: #f1c40f; padding: 2px 5px; border-radius: 3px;">${
                        room.PaymentCycleType
                      }</span></p>
                      <p style="font-size: 0.9em; color: #7f8c8d;">Days until payment: ${daysUntil}</p>
                    </div>
                  `
                  )
                  .style('left', event.pageX + 10 + 'px')
                  .style('top', event.pageY - 10 + 'px');
              })
              .on('mousemove', (event) => {
                tooltip
                  .style('left', event.pageX + 10 + 'px')
                  .style('top', event.pageY - 10 + 'px');
              })
              .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
              });
          }
        });
      });
    }
  }, [filteredRooms, numberOfMonths, tenantList]);

  const handleMonthsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setNumberOfMonths(isNaN(value) ? initialMonths : Math.max(1, value));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Search by tenant name"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <label htmlFor="monthsInput">Months to show: </label>
        <input
          id="monthsInput"
          type="number"
          min="1"
          value={numberOfMonths}
          onChange={handleMonthsChange}
        />
      </div>
      <svg ref={ref}></svg>
    </div>
  );
};

export default CalendarGUI;

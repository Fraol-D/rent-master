import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CalendarProps {
  rooms: RoomType[];
  numberOfMonths: number;
}

const Calendar: React.FC<CalendarProps> = ({ rooms, numberOfMonths,tenantList }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      d3.select(ref.current).selectAll('*').remove(); // Clear the SVG before re-rendering
  
      const width = 1500;
      const height = rooms.length * 50;
      const cellSize = 20;
      const margin = { top: 70, right: 30, bottom: 30, left: 100 };
  
      const svg = d3
        .select(ref.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      const today = new Date();
      const startDate = d3.timeDay.offset(today, -7); // One week ago
      const endDate = d3.timeMonth.offset(today, 2); // Two months from now
  
      const xScale = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([0, width]);
  
      const yScale = d3
        .scaleBand()
        .domain(rooms.map((room) => room.id))
        .range([0, height-60])
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
          const monthCenter = new Date((monthStart.getTime() + monthEnd.getTime()) / 2);
          if (monthCenter >= startDate && monthCenter <= endDate) {
            return d3.timeFormat('%B')(d);
          }
          return '';
        })
        .tickSize(0);
  
      svg.append('g').call(monthAxis).attr('transform', `translate(0, -40)`);
      svg.append('g').call(xAxis).attr('transform', `translate(0, -20)`);
  
      const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
        const room = rooms.find((room) => room.id === d);
        return room ? `Flr. ${room.floor} Rm. ${room.roomIndex}` : '';
      });
  
      svg.append('g').call(yAxis);
  
      // Add x-axis grid lines aligned with room text
      svg
        .selectAll('.x-grid')
        .data(yScale.domain())
        .enter()
        .append('line')
        .attr('class', 'x-grid')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (d) => yScale(d)-4 || 0)
        .attr('y2', (d) => yScale(d)-4 || 0)
        .attr('stroke', '#DDDDDD80');
  
      svg
        .selectAll('.x-grid-bottom')
        .data(yScale.domain())
        .enter()
        .append('line')
        .attr('class', 'x-grid-bottom')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (d) => (yScale(d) || 0) + yScale.bandwidth())
        .attr('y2', (d) => (yScale(d) || 0) + yScale.bandwidth())
        .attr('stroke', '#DDDDDD70');
  
      // Add y-axis grid lines on every x axis day tick
      svg
        .selectAll('.y-grid')
        .data(xScale.ticks(d3.timeDay))
        .enter()
        .append('line')
        .attr('class', 'y-grid')
        .attr('x1', (d) => xScale(d))
        .attr('x2', (d) => xScale(d))
        .attr('y1', 0-20)
        .attr('y2', height-65)
        .attr('stroke', '#DDDDDD7F');
  
      // Highlight the current date
      const currentDateRect = svg
        .append('rect')
        .attr('x', xScale(today)-7)
        .attr('y', 0-20)
        .attr('width', cellSize)
        .attr('height', height-45)
        .attr('fill', 'yellow')
        .attr('opacity', 0.1);
  
      // Add month start and end indicators
      const monthStarts = d3.timeMonths(startDate, endDate);
      svg
        .selectAll('.month-indicator')
        .data(monthStarts)
        .enter()
        .append('line')
        .attr('class', 'month-indicator')
        .attr('x1', (d) => xScale(d))
        .attr('x2', (d) => xScale(d))
        .attr('y1', -20)
        .attr('y2', height-65)
        .attr('stroke', 'lab(29.57 68.3 -112.05 / 0.32)')
        .attr('stroke-width', 2);
       
        const lineStrokeWidth = 2.5;
        const tooltipBackgroundColor = 'rgba(0,0,0,0.6)';
        const tooltipTextColor = '#fff';
      // Create a tooltip
      const tooltip = d3.select("body").append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', tooltipBackgroundColor)
      .style('color', tooltipTextColor)
      .style('padding', '8px').style("z-index", 5)
      .style('border-radius', '4px')
      .style('font-size', "14px");


      rooms.forEach((room) => {
        room.AllRoomPayInfo.RoomPayInfo.forEach((payment) => {
          const paymentDate = new Date(payment.Day); // Assuming payment.Day is in milliseconds
  
          if (paymentDate >= startDate && paymentDate <= endDate) {
            svg
              .append('rect')
              .attr('x', xScale(paymentDate)-2)
              .attr('y', yScale(room.id)-4)
              .attr('width', cellSize)
              .attr('height', yScale.bandwidth()+4)
              .attr('fill', payment.Paid ? 'green' : 'red')
              .attr('opacity', 0.5)
              .on('mouseover', (event, d) => {
              console.log("Over");
              tooltip.style('visibility', 'hidden');
      
                  tooltip.html(`Agreed Price: ${room.AgreedPrice}<br/>Tenant ID: ${tenantList.find((t:tenant) => t.id == room.tenantId).name}<br/>Payment Cycle: ${room.PaymentCycleType}`)
                  .style("left", (event.pageX) + "px")
                  .style("top", (event.pageY - 28) + "px");
              })
              .on('mousemove', (event) => {
              console.log("move");

                tooltip
                  .style('top', `${event.pageY + 10}px`)
                  .style('left', `${event.pageX + 10}px`);
              })
              .on('mouseout', () => {
              console.log("out");

                tooltip.style('visibility', 'hidden');
              })
          }
        });
      });
    }
  }, [rooms, numberOfMonths]);
  
  return <svg ref={ref}></svg>;
};

export default Calendar;
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CalendarProps {
  rooms: RoomType[];
  numberOfMonths: number;
}

const Calendar: React.FC<CalendarProps> = ({ rooms, numberOfMonths }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      d3.select(ref.current).selectAll('*').remove(); // Clear the SVG before re-rendering
  
      const width = 1500;
      const height = rooms.length * 50;
      const cellSize = 20;
      const margin = { top: 50, right: 30, bottom: 30, left: 100 };
  
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
        .range([0, height])
        .padding(0.1);
  
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(d3.timeDay.every(1))
        .tickFormat(d3.timeFormat('%d'))
        .tickSizeOuter(0);
  
      const monthAxis = d3
        .axisTop(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat('%B'))
        .tickSize(0);
  
      svg.append('g').call(monthAxis).attr('transform', `translate(0, -20)`);
      svg.append('g').attr('transform', `translate(0, ${height})`).call(xAxis);
  
      const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
        const room = rooms.find((room) => room.id === d);
        return room ? `Room ${room.roomIndex}` : '';
      });
  
      svg.append('g').call(yAxis);
  
      // Add x-axis grid lines
      svg
        .selectAll('.x-grid')
        .data(xScale.ticks())
        .enter()
        .append('line')
        .attr('class', 'x-grid')
        .attr('x1', (d) => xScale(d))
        .attr('x2', (d) => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#ddd');
  
      // Add y-axis grid lines
      svg
        .selectAll('.y-grid')
        .data(yScale.domain())
        .enter()
        .append('line')
        .attr('class', 'y-grid')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (d) => yScale(d) + yScale.bandwidth() / 2)
        .attr('y2', (d) => yScale(d) + yScale.bandwidth() / 2)
        .attr('stroke', '#ddd');
  
      // Highlight the current date
      const currentDateRect = svg
        .append('rect')
        .attr('x', xScale(today))
        .attr('y', 0)
        .attr('width', cellSize)
        .attr('height', height)
        .attr('fill', 'yellow')
        .attr('opacity', 0.2);
  
      rooms.forEach((room) => {
        room.AllRoomPayInfo.RoomPayInfo.forEach((payment) => {
          const paymentDate = new Date(payment.Day); // Assuming payment.Day is in milliseconds
  
          if (paymentDate >= startDate && paymentDate <= endDate) {
            svg
              .append('rect')
              .attr('x', xScale(paymentDate))
              .attr('y', yScale(room.id))
              .attr('width', cellSize)
              .attr('height', yScale.bandwidth())
              .attr('fill', payment.Paid ? 'green' : 'red')
              .attr('opacity', 0.5);
          }
        });
      });
    }
  }, [rooms, numberOfMonths]);
  
  return <svg ref={ref}></svg>;
};

export default Calendar;

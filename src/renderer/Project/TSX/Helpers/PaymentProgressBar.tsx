import React, { useState, useEffect, useRef } from 'react';
import { format, isBefore, isAfter, subDays, differenceInDays } from 'date-fns';
import * as d3 from 'd3';

export type RoomPayInfo = {
  Day: number; // milliseconds since January 1, 1970, 00:00:00 UTC
  Paid: boolean;
};

interface Props {
  paymentData: RoomPayInfo[];

  agreedPrice: number;
  roomType: RoomType;
  roomPaymentInfoApi: any;
}

const PaymentProgressBar: React.FC<Props> = ({
  paymentData,
  roomPaymentInfoApi,
  agreedPrice,
  roomType,
}) => {
  const today = new Date().getTime();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (paymentData.length > 0 && svgRef.current) {
      const svg = d3.select(svgRef.current);

      const paymentWidth = 75; // Width of each payment section
      const width = paymentData.length * paymentWidth; // Total width based on number of payments
      const height = 120; // Increased height to accommodate dates
      const padding = 30;

      // Clear existing SVG content
      svg.selectAll('*').remove();

      // Set SVG dimensions
      svg.attr('width', width);
      // Draw payment lines
      const paymentLines = svg
        .selectAll('line.payment-line')
        .data(paymentData)
        .enter()
        .append('line')
        .attr('class', 'payment-line')
        .attr(
          'x1',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('y1', height / 2 - 25) // Moved line start position up
        .attr(
          'x2',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('y2', height / 2 + 54) // Moved line end position down
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5, 5')
        .attr('stroke', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'green';
          if (isAfter(d.Day, today) && subDays(d.Day, 10) <= today)
            return '#00e1ff';
          return 'blue';
        });
      // Draw progress bar background
      svg
        .append('rect')
        .attr('x', padding)
        .attr('y', height / 2 + 15)
        .attr('width', width - 2 * padding)
        .attr('height', 10)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#aaa')
        .attr('stroke-width', '1');

      // Draw current date indicator
      const currentDateX =
        ((today - paymentData[0].Day) /
          (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
          (width - 2 * padding) +
        padding;
      svg
        .append('line')
        .attr('x1', 0)
        .attr('y1', height / 2 + 20)
        .attr('x2', currentDateX)
        .attr('y2', height / 2 + 20)
        .attr('stroke', '#454959')
        .attr('stroke-width', '15');
      svg
        .append('line')
        .attr('x1', currentDateX)
        .attr('y1', height / 2 + 5)
        .attr('x2', currentDateX)
        .attr('y2', height / 2 + 35)
        .attr('stroke', '#00e1f1')
        .attr('stroke-width', '5');
      svg
        .append('text')
        .attr('x', currentDateX)
        .attr('y', height / 2 + 48)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14')
        .text(format(today, 'MMMM d'));

      // Draw payment dates
      const paymentDates = svg
        .selectAll('text.payment-date')
        .data(paymentData)
        .enter()
        .append('text')
        .attr('class', 'payment-date')
        .style('fill', 'white')
        .attr(
          'x',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('y', height / 2 - 45) // Moved dates above the progress bar
        .attr('text-anchor', 'middle')
        .text((d: { Day: number }) => format(d.Day, 'MMM d'));
      const paymentDates1 = svg
        .selectAll('text.payment-date1')
        .data(paymentData)
        .enter()
        .append('text')
        .attr('class', 'payment-date')
        .style('fill', 'white')
        .style('font-size', '10')
        .attr(
          'x',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('y', height / 2 - 30) // Moved dates above the progress bar
        .attr('text-anchor', 'middle')
        .text((d: { Day: number }) => format(d.Day, 'yyyy'));
      // Draw payment circles
      const paymentCircles = svg
        .selectAll('circle.payment-circle')
        .data(paymentData)
        .enter()
        .append('circle')
        .attr('class', 'payment-circle')
        .attr(
          'cx',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('cy', height / 2 + 20) // Moved circles below the progress bar
        .attr('r', 3)
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'green';
          if (isAfter(d.Day, today) && subDays(d.Day, 10) <= today)
            return 'lightblue';
          return 'blue';
        });

      // Draw pay buttons using D3 elements aligned under each payment section
      const payButtons = svg
        .selectAll('text.pay-button')
        .data(paymentData)
        .enter()
        .append('text')
        .attr('class', 'pay-button')
        .attr(
          'x',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('y', height / 2 + 65) // Adjusted position below payment circles
        .attr('text-anchor', 'middle')
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'green';
          if (isAfter(d.Day, today) && subDays(d.Day, 10) <= today)
            return 'lightblue';
          return 'white';
        })
        .style('font-size', '14')
        .style('cursor', 'pointer')
        .text((d: { Paid: boolean }) => (d.Paid ? 'Paid' : 'Pay'))
        .on('click', (event: any, d: any) => {
          const updatedData = paymentData.map((item) => {
            if (item.Day === d.Day) {
              return { ...item, Paid: true };
            }
            return item;
          });
          roomPaymentInfoApi.editRoomPaymentApi(d.id, 'Paid', true);
        });
      const payButtons2 = svg
        .selectAll('text2.pay-button')
        .data(paymentData)
        .enter()
        .append('text')
        .attr('class', 'pay-button')
        .attr(
          'x',
          (d: { Day: number }) =>
            ((d.Day - paymentData[0].Day) /
              (paymentData[paymentData.length - 1].Day - paymentData[0].Day)) *
              (width - 2 * padding) +
            padding
        )
        .attr('y', height / 2 + 78) // Adjusted position below payment circles
        .attr('text-anchor', 'middle')
        .attr('fill', (d: { Day: number; Paid: boolean }) => {
          if (isBefore(d.Day, today) && !d.Paid) return 'red';
          if (d.Paid) return 'green';
          if (isAfter(d.Day, today) && subDays(d.Day, 10) <= today)
            return 'lightblue';
          return 'white';
        })
        .style('font-size', '12')
        .style('cursor', 'pointer')
        .text(agreedPrice.toLocaleString() + '$ X')
        .on('click', (event: any, d: any) => {
          const updatedData = paymentData.map((item) => {
            if (item.Day === d.Day) {
              if (item.Paid) {
                return { ...item, Paid: false };
              } else {
                return { ...item, Paid: true };
              }
            }
            return item;
          });

          if (d.Paid) {
            roomPaymentInfoApi.editRoomPaymentApi(d.id, 'Paid', false);
          } else {
            roomPaymentInfoApi.editRoomPaymentApi(d.id, 'Paid', true);
          }
        });

      // Update payment status on click
      paymentCircles.on('click', (event: any, d: any) => {
        const updatedData = paymentData.map((item) => {
          if (item.Day === d.Day) {
            return { ...item, Paid: true };
          }
          return item;
        });
        roomPaymentInfoApi.editRoomPaymentApi(d.id, 'Paid', true);
      });
    }
  }, [paymentData, today, paymentData]);

  // Calculate days until or past due date for paragraph message
  const dueDate = paymentData.find((payment) => !payment.Paid)?.Day;
  const daysDifference = dueDate
    ? differenceInDays(new Date(dueDate), new Date(today))
    : undefined;
  const message =
    daysDifference !== undefined
      ? daysDifference > 0
        ? `Due in ${daysDifference + 1} day${
            daysDifference + 1 !== 1 ? 's' : ''
          }. Earnings: $${
            (agreedPrice * paymentData.filter((payment) => payment.Paid).length).toLocaleString()
          }. ${paymentData.filter((payment) => payment.Paid).length} payments.`
        : `Payment is past due by ${Math.abs(daysDifference)} days.`
      : 'No payment information available.';

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
          }}
        >
          {message}
        </p>
      </div>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <svg ref={svgRef} width="100%" height="142" />
      </div>
    </div>
  );
};

export default PaymentProgressBar;

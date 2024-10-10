import React, { useState, useEffect, useRef } from 'react';
import { format, isBefore, isAfter, subDays, differenceInDays } from 'date-fns';
import * as d3 from 'd3';
import editIconDark from '../../../../assets/assets/Dark mode/Editicon.png';
import editIconLight from '../../../../assets/assets/Light mode/Editicon.png';
import {
  deleteReceipt2,
  uploadReceiptDocuments,
} from 'Backend/localServerApis';
import UtilityPanel from './UtilityPanel';
export type RoomPayInfo = {
  Day: number; // milliseconds since January 1, 1970, 00:00:00 UTC
  Paid: boolean;
};

interface Props {
  paymentData: RoomPayInfo[];
  agreedPrice: number;
  roomType: RoomType;
  tenantList: tenant[];
  roomPaymentInfoApi: any;
  refresh: () => void;
  extendPaymentSchedule: () => void;
  ShowReceipt: boolean;
  setShowReceipt: React.Dispatch<React.SetStateAction<boolean>>;
}

const PaymentProgressBarGUI: React.FC<Props> = ({
  paymentData,
  roomPaymentInfoApi,
  agreedPrice,
  roomType,
  extendPaymentSchedule,
  refresh,
  tenantList,ShowReceipt,setShowReceipt
}) => {
  const today = new Date().getTime();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const [selectedDates, setSelectedDates] = useState<number[]>([]); // State to track selected dates
  
  const [showUtilityPanel, setShowUtilityPanel] = useState(false);

  useEffect(() => {
    if (paymentData.length > 0 && svgRef.current) {
      const sortedPaymentData = [...paymentData].sort((a, b) => a.Day - b.Day);
      const svg = d3.select(svgRef.current);

      // Clear existing SVG content
      svg.selectAll('*').remove();

      // Calculate the width and height based on the number of payments
      const paymentWidth = 75; // Width of each payment section
      const width = sortedPaymentData.length * paymentWidth + 40; // Total width based on number of payments
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
        .attr('width', width - 40)
        .attr('height', 10)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#aaa')
        .attr('stroke-width', '1');

      // Draw current date indicator
      const currentDateX =
        padding +
        ((today - sortedPaymentData[0].Day) /
          (sortedPaymentData[sortedPaymentData.length - 1].Day -
            sortedPaymentData[0].Day)) *
          width;
      svg
        .append('line')
        .attr('x1', 0)
        .attr('y1', padding + height / 2 - 30)
        .attr('x2', currentDateX + 36.5)
        .attr('y2', padding + height / 2 - 30)
        .attr('stroke', 'var(--Secondary-Color)')
        .attr('stroke-width', '15');
      svg
        .append('line')
        .attr('x1', currentDateX + 36.3)
        .attr('y1', padding + height / 2 - 40)
        .attr('x2', currentDateX + 36.3)
        .attr('y2', padding + height / 2 - 18)
        .attr('stroke', '#00e1f1')
        .attr('stroke-width', '5');
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
        .on('click', (event: any, d: any) => {
          const updatedData = sortedPaymentData.map((item) => {
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
            roomPaymentInfoApi.editRoomPaymentApi(
              d.id,
              'Paid',
              0,
              roomType.id,
              roomType.AllRoomPayInfo.RoomPayInfo
            );
          } else {
            roomPaymentInfoApi.editRoomPaymentApi(
              d.id,
              'Paid',
              1,
              roomType.id,
              roomType.AllRoomPayInfo.RoomPayInfo
            );
          }
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
            ? agreedPrice.toLocaleString() + '$ X'
            : d.Value.toLocaleString() + '$ X';
        })
        .on('click', (event: any, d: any) => {
          const updatedData = sortedPaymentData.map((item) => {
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
            roomPaymentInfoApi.editRoomPaymentApi(
              d.id,
              'Paid',
              0,
              roomType.id,
              roomType.AllRoomPayInfo.RoomPayInfo
            );
          } else {
            roomPaymentInfoApi.editRoomPaymentApi(
              d.id,
              'Paid',
              1,
              roomType.id,
              roomType.AllRoomPayInfo.RoomPayInfo
            );
          }
        });
      /////////////////////////////////////////////
      if(ShowReceipt) {
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
          .attr('fill', 'var(--Secondary-Color)') .attr('stroke', 'var(--Text-Color)');
  
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
                    tenantList.find((t: tenant) => t.id === tenantId)?.name || '';
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
            window.electron.ipcRenderer.send('show-item-in-folder', receiptFile);
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
          .attr('x', width + padding - 30)
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
          .attr('x', width + padding)
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
  }, [paymentData, today, paymentData]);
  // Function to handle multi-pay
  const handleMultiPay = async () => {
    for (let i = 0; i < selectedDates.length; i++) {
      const date = selectedDates[i];
      const payment = paymentData.find((item) => item.Day === date);
      if (payment && !payment.Paid) {
        await roomPaymentInfoApi.editRoomPaymentApi(
          payment.id,
          'Paid',
          1,
          roomType.id,
          roomType.AllRoomPayInfo.RoomPayInfo
        );
      }
    }
    refresh();
  };
  const handleMultiUnPay = async () => {
    for (let i = 0; i < selectedDates.length; i++) {
      const date = selectedDates[i];
      const payment = paymentData.find((item) => item.Day === date);

      if (payment && payment.Paid) {
        // Changed condition to check if payment is Paid
        await roomPaymentInfoApi.editRoomPaymentApi(
          payment.id,
          'Paid',
          0,
          roomType.id,
          roomType.AllRoomPayInfo.RoomPayInfo
        );
      }
    }
    refresh();
  };
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
          }. Earnings: ${(
            agreedPrice * paymentData.filter((payment) => payment.Paid).length
          ).toLocaleString()}. ${
            paymentData.filter((payment) => payment.Paid).length
          } payments.`
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
            setShowUtilityPanel(!ShowReceipt)
          }}
        >
          RCT
        </button>
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
          height: ShowReceipt ?'220px' : '174px',
          transition:"all .2s"
        }}
      >
        {' '}
        <svg ref={svgRef} width="100%" height="126" />
      </div>
     
    </div>
  );
};

export default React.memo(PaymentProgressBarGUI);

import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { Console } from 'console';

const DashbRoomSummary = ({ RoomList }: { RoomList: RoomType[] }) => {
  const takenRoomsCount = RoomList.filter(
    (room) => room.status === 'Taken'
  ).length;
  const emptyRoomsCount = RoomList.filter(
    (room) => room.status === 'Empty'
  ).length;

  const roomSummaryData = [
    { id: 0, value: takenRoomsCount, label: 'Taken Rooms' },
    { id: 1, value: emptyRoomsCount, label: 'Empty Rooms' },
  ];

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{ width: '400px' }}
    >
      <p className='DashboardWigetPieChartTextHeader'>Rooms Status</p>
      <PieChart
        series={[
          {
            data: roomSummaryData,
            arcLabel: (item) => `${item.label} (${item.value})`,
          },
        ]}
        width={400}
        height={350}
        sx={(theme) => ({
          
          [`.${axisClasses.root}`]: {
            [`.${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: 'white',
              strokeWidth: 1,
            },
            [`.${axisClasses.tickLabel}`]: {
              fill: 'white',
            },
          },
        })}
      />
      <p className="DashboardWigetPieChartText" style={{ color: 'white' }}>{RoomList.length} Total rooms</p>
      <p className="DashboardWigetPieChartText" style={{ color: 'white' }}>
        {roomSummaryData[0].value} Rooms are occupied
      </p>
      <p className="DashboardWigetPieChartText" style={{ color: 'white' }}>
        {roomSummaryData[1].value} Rooms are Vacant(Empty)
      </p>
    </div>
  );
};

export default DashbRoomSummary;
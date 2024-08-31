import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { Console } from 'console';

const DashbRoomSummary = ({ RoomList }: { RoomList: RoomType[] }) => {
  const takenRoomsCount = RoomList.filter(
    (room) => room.status === 'Taken' && !room.Archived
  ).length;
  const emptyRoomsCount = RoomList.filter(
    (room) => room.status === 'Empty' && !room.Archived
  ).length;

  const roomSummaryData = [
    { id: 0, value: takenRoomsCount, label: 'Taken Rooms', color: 'var(--Primary-Color)' },
    { id: 1, value: emptyRoomsCount, label: 'Empty Rooms', color: 'var(--Accent-Color50)' },
  ];

  return (
    <div className="DashboardWigetMainContainer" style={{ width: '400px' }}>
      <p className="DashboardWigetPieChartTextHeader">Rooms Status</p>
      <PieChart
        series={[
          {
            data: roomSummaryData,
            arcLabel: (item) => `${item.label} (${item.value})`,
            arcLabelMinAngle: 45,
          },
        ]}
        width={400}
        height={350}
        colors={roomSummaryData.map((item) => item.color)}
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
          '.MuiChartsLegend-label': {
            fill: 'white',
          },
          '.MuiChartsLegend-mark': {
            rx: 10,
            ry: 10,
          },
          '.MuiChartsArcLabel-root': {
            fill: 'white',
            fontWeight: 'bold',
          },
        })}
      />
      <p className="DashboardWigetPieChartText">
        {RoomList.length} Total rooms
      </p>
      <p className="DashboardWigetPieChartText">
        {roomSummaryData[0].value} Rooms are occupied
      </p>
      <p className="DashboardWigetPieChartText">
        {roomSummaryData[1].value} Rooms are Vacant(Empty)
      </p>
    </div>
  );
};

export default DashbRoomSummary;
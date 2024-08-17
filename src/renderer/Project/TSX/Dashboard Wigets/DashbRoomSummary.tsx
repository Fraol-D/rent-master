import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
const DashbRoomSummary = ({ RoomList }: { RoomList: RoomType[] }) => {
  // Step 1: Filter and count room statuses
  const takenRoomsCount = RoomList.filter(
    (room) => room.status === 'Taken'
  ).length;
  const emptyRoomsCount = RoomList.filter(
    (room) => room.status === 'Empty'
  ).length;

  // Step 2: Create pie chart data
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
        sx={{
          [`& .MuiPieArc-label`]: {
            fill: 'white',
            fontWeight: 'bold',
            strokeWidth:0,
            color:"white"
          },
        }}
      />
      <p className="DashboardWigetPieChartText">{RoomList.length} Total rooms</p>
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

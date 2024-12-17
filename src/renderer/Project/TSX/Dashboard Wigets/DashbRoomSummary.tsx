import React, { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';

const DashbRoomSummary = ({ RoomList }: { RoomList: RoomType[] }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
   

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate scale factor based on window width
  const getScaleFactor = () => {
    if (windowWidth <= 1280) return 1280 / 1920;
    if (windowWidth <= 1366) return 1366 / 1920;
    if (windowWidth >= 2560) return 3840 / 1920;
    return 1;
  };

  const scaleFactor = getScaleFactor();

  // Base dimensions
  const baseWidth = 400;
  const baseHeight = 350;

  // Scaled dimensions
  const scaledWidth = baseWidth * scaleFactor;
  const scaledHeight = baseHeight * scaleFactor;

  const takenRoomsCount = RoomList.filter(
    (room) => room.status === 'Taken' && !room.Archived
  ).length;
  const emptyRoomsCount = RoomList.filter(
    (room) => room.status === 'Empty' && !room.Archived
  ).length;

  const roomSummaryData = [
    {
      id: 0,
      value: takenRoomsCount,
      label: 'Taken Rooms',
      color: 'var(--Primary-Color)',
    },
    {
      id: 1,
      value: emptyRoomsCount,
      label: 'Empty Rooms',
      color: 'var(--Accent-Color50)',
    },
  ];

  
  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: 'var(--400px-V)',
        height: 'var(--510px-V)',
      }}
    >
      <p
        className="DashboardWigetPieChartTextHeader"
        style={{
          marginBottom: 'var(--10px-V)',
        }}
      >
        Rooms Status
      </p>
      <PieChart
        series={[
          {
            data: roomSummaryData,
            arcLabel: (item) => `${item.label} (${item.value})`,
            arcLabelMinAngle: 45,
            
          },
        ]}
        colors={roomSummaryData.map((item) => item.color)}
        sx={{
          [`& .${axisClasses.root}`]: {
            [`& .${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: 'var(--Text-Color)',
              strokeWidth: 1,
              fontSize: 'var(--12px-V)',
            },
            [`& .${axisClasses.tickLabel}`]: {
              fill: 'var(--Text-Color)',
              fontSize: 'var(--12px-V)',
            },
          },
          '& .MuiChartsLegend-label': {
            fill: 'var(--Text-Color)',
            fontSize: 'var(--12px-V)',
          },
          '& .MuiChartsArcLabel-root': {
            fill: 'var(--Text-Color)',
            fontWeight: 'bold',
            fontSize: 'var(--12px-V)',
          },
        }}
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

export default React.memo(DashbRoomSummary);

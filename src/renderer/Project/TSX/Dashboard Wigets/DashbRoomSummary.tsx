import React, { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';

const DashbRoomSummary = ({ RoomList }: { RoomList: RoomType[] }) => {


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
  const screenWidth = window.innerWidth;
  const [scaleFactor, setScaleFactor] = useState(1);
  
  useEffect(() => {
   if (screenWidth <= 1280) {
      setScaleFactor(1280 / 1920);
  } else if (screenWidth <= 1366) {
    setScaleFactor(1366 / 1920);
  } else if (screenWidth <= 1920) {
    setScaleFactor(1920 / 1920);
  } else {
    setScaleFactor(2560 / 2560);
  }
  }, [ window.innerWidth]);
  return (
    <div
      className="DashboardWigetMainContainer"
      id="DashbRoomSummary"
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
    margin={
      {
        top: 0,
        left: 50,
        right: 50,
        bottom: 0,
      }
    }
        slotProps={{
          legend: {
            hidden: true
          },
        }}
        colors={roomSummaryData.map((item) => item.color)}
       
        
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

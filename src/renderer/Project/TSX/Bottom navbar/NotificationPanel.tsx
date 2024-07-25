import React from 'react'

const NotificationPanel: React.FC = ({RoomList}:any) => {
  const [selectedFilter, setSelectedFilter] = React.useState<string>('')

  const notifications = () =>{
    if(selectedFilter =="PaymentDates") {

    }
  }
  
  return (
    <div className="notification-panel">
      <h2>Notifications</h2>
      <select
        className="notification-select"
        value={selectedFilter}
        onChange={(e) => setSelectedFilter(e.target.value)}
      >
        <option value="all">All Notifications</option>
        <option value="PaymentDates">Payment Dates</option>
      </select>

    </div>
  )
}

export default NotificationPanel

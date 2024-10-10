import React from 'react'

const NotAllowedScreen = () => {
  return (
    <div>
      you are not allowed to use the app, bc you have not completed payment. please complete payment to continue using the app.
    </div>
  )
}

export default React.memo( NotAllowedScreen)

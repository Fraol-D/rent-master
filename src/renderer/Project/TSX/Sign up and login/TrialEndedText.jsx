import { storageManager } from '../../../storeManager';
import React from 'react';
export default function TrialEndedText({}) {
  return (
    <div
      style={{
        color: 'white',
        fontSize: 20,
      }}
    >
      Your 7-day trial period has Ended. Started at{' '}
      {new Date(
        storageManager.get('TrailEndDate') - 7 * 24 * 60 * 60 * 1000
      ).getMonth() + 1}
      /
      {new Date(
        storageManager.get('TrailEndDate') - 7 * 24 * 60 * 60 * 1000
      ).getDate()}
      /
      {new Date(
        storageManager.get('TrailEndDate') - 7 * 24 * 60 * 60 * 1000
      ).getFullYear()}{' '}
      and ended at {new Date(storageManager.get('TrailEndDate')).getMonth() + 1}
      / {new Date(storageManager.get('TrailEndDate')).getDate()}/
      {new Date(storageManager.get('TrailEndDate')).getFullYear()} <br />
      If you're interested in our application, you can purchase the full package
      by contacting us at the following phone number:"
      <br />
      Phone Number: <strong>0944 50 8888</strong>
      <br />
      Phone Number 2: <strong>0944 50 9999</strong>
      <br />
      <br />
      Alternatively, you can reach us on Telegram using this number:
      <br />
      <br />
      Telegram Contact 1:
      <strong>+251 98 304 0511</strong>
      <br />
      Telegram Contact 2:
      <strong>+251 944 50 9999</strong>
      <br />
      <br />
      <br />
      የ7-ቀን ሙከራ አልቋል <br />
      የሙሉጊዜ፡አግልግሎት፡ከፈለጉ፡በዚ፡ስልክ፡ቁጥር፡ይደውሉ፡"09 44 50 8888", "09 44 50 9999",
      Telegram ያግኙ፡"0983040511", "09 44 50 9999" @ChristianTaye
    </div>
  );
}

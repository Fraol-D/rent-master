/*
  Blink

  Turns an LED on for one second, then off for one second, repeatedly.

  Most Arduinos have an on-board LED you can control. On the UNO, MEGA and ZERO
  it is attached to digital pin 13, on MKR1000 on pin 6. LED_BUILTIN is set to
  the correct LED pin independent of which board is used.
  If you want to know what pin the on-board LED is connected to on your Arduino
  model, check the Technical Specs of your board at:
  https://www.arduino.cc/en/Main/Products

  modified 8 May 2014
  by Scott Fitzgerald
  modified 2 Sep 2016
  by Arturo Guadalupi
  modified 8 Sep 2016
  by Colby Newman

  This example code is in the public domain.

  https://www.arduino.cc/en/Tutorial/BuiltInExamples/Blink
*/

// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(11, OUTPUT);
  pinMode(10, OUTPUT);
  pinMode(9, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  
  fadeAPin(13, 5, 5, false);
}
void blink2 () {
     digitalWrite(13, HIGH);  
  delay(100); 
  digitalWrite(12, HIGH);
  delay(50); 
  digitalWrite(11, HIGH);
  delay(25); 
  digitalWrite(10, HIGH);
  delay(12); 
  digitalWrite(9, HIGH);
  delay(100);                       // wait for a second
    digitalWrite(13, LOW);  
    delay(50); 
  digitalWrite(12, LOW);
  delay(25); 
  digitalWrite(11, LOW);
  delay(12); 
  digitalWrite(10, LOW);
  delay(200); 
  digitalWrite(9, LOW);   // turn the LED off by making the voltage LOW
  delay(12);         
}
void blink1() {
    digitalWrite(13, HIGH); 

  delay(100); 
  
  digitalWrite(12, HIGH);
  
  delay(50); 
  
  digitalWrite(11, HIGH);
  
  delay(25); 
  
  digitalWrite(10, HIGH);
  
  delay(12); 
  
  digitalWrite(9, HIGH);
  
  delay(100);                       // wait for a second

  digitalWrite(9, LOW);   
  
  delay(50); 
  
  digitalWrite(10, LOW);
  
  display(25); 
  
  digitalWrite(11, LOW);
  
  delay(12); 
  
  digitalWrite(12, LOW);
  
  delay(200); 
  
  digitalWrite(13, LOW);  
  
  delay(12);   
}

void blink3() {
  digitalWrite(13, HIGH); 

  delay(100); 
  
  digitalWrite(12, HIGH);
  
  delay(50); 
  
  digitalWrite(11, HIGH);
  
  delay(25); 
  
  digitalWrite(10, HIGH);
  
  delay(12); 
  
  digitalWrite(9, HIGH);
  
  delay(100);                       // wait for a second

  digitalWrite(9, LOW);   
  
  delay(50); 
  
  digitalWrite(10, LOW);
  
  display(25); 
  
  digitalWrite(11, LOW);
  
  delay(12); 
  
  digitalWrite(12, LOW);
  
  delay(200); 
  
  digitalWrite(13, LOW);  
  
  delay(12);   
}
void blink4() {
  .,/j
  blinkAPin(13, 100, true,false);
  blinkAPin(12, 100, true,false);
  blinkAPin(11, 100, true,false);
  blinkAPin(10, 100, true,false);
  blinkAPin(9, 100, true,false);
  delay(500);
  blinkAPin(9, 100, true,true);
  blinkAPin(10, 100, true,true);
  blinkAPin(11, 100, true,true);
  blinkAPin(12, 100, true,true);
  blinkAPin(13, 100, true,true);
}
 
void blinkAPin(int pinId, int delayTime, bool delayAfter, bool lowToHigh) {
 if(lowToHigh) {
  digitalWrite(pinId, LOW);
  delay(delayTime);
digitalWrite(pinId, HIGH);
  if(delayAfter)
    delay(delayTime);
 } else {
  digitalWrite(pinId, HIGH);
  delay(delayTime);
  digitalWrite(pinId, LOW);
  if(delayAfter)
    delay(delayTime);
 }
}
void fadeAPin(int pinId, int totalTime, int fadeAmount, bool from255) { 
    int brightness = from255 ? 255 : 0; 
 analogWrite(pinId, brightness); 
    int ticksToFinish = 255 / fadeAmount; 
    int delayPer = totalTime / ticksToFinish; 

    for (int i = 0; i <= ticksToFinish; i++) { 
        analogWrite(pinId, brightness); 
        brightness = from255 ? brightness - fadeAmount : brightness + fadeAmount; 
        delay(delayPer); 
    } 
}

// Sample RFM69 sender/node sketch, with ACK and optional encryption
// Sends periodic messages of increasing length to gateway (id=1)
// It also looks for an onboard FLASH chip, if present
// Library and code by Felix Rusu - felix@lowpowerlab.com
// Get the RFM69 and SPIFlash library at: https://github.com/LowPowerLab/

#include <RFM69.h>    //get it here: https://www.github.com/lowpowerlab/rfm69
#include <SPI.h>
#include <SimpleTimer.h>
#include <EEPROM.h>

#define NODEID        2    //unique for each node on same network
#define NETWORKID     100  //the same on all nodes that talk to each other
#define GATEWAYID     1
//Match frequency to the hardware version of the radio on your Moteino (uncomment one):
//#define FREQUENCY   RF69_433MHZ
//#define FREQUENCY   RF69_868MHZ
#define FREQUENCY     RF69_915MHZ
#define ENCRYPTKEY    "FH62kz80Pfehl752" //exactly the same 16 characters/bytes on all nodes!

#define ACK_TIME      30 // max # of ms to wait for an ack
#ifdef __AVR_ATmega1284P__
  #define LED           15 // Moteino MEGAs have LEDs on D15
  #define FLASH_SS      23 // and FLASH SS on D23
#else
  #define LED           9 // Moteinos have LEDs on D9
  #define FLASH_SS      8 // and FLASH SS on D8
#endif

#define IN1             4  // pin number for input 1 (active high)
#define IN2             5  // pin number for input 2 (active low)
#define OUTA            10 // pin number for output A
#define OUTB            11 // pin number for output B
#define OUTC            12 // pin number for output C
#define OUTD            13 // pin number for output D

#define IN1_DEBOUNCE      100 // time in ms before reading input1 again (de-bounce)
#define IN2_DEBOUNCE      100 // time in ms before reading input1 again (de-bounce)

#define SERIAL_BAUD   115200

int MEMoutADefault = 10; //arbitrarily started at 10 - need one byte for holding default state
int MEMoutBDefault = MEMoutADefault + 1; //starts one byte after MEMoutADefault - need one byte
int MEMoutCDefault = MEMoutBDefault + 1;
int MEMoutDDefault = MEMoutCDefault + 1;
int MEMin1Default = MEMoutDDefault + 1;
int MEMin2Default = MEMin1Default + 1;


bool in1_ready = true;
bool in2_ready = true;
bool in1_enabled = true;
bool in2_enabled = true;
bool outA_enabled = true;
bool outB_enabled = true;
bool outC_enabled = true;
bool outD_enabled = true;
bool outA_state = LOW;
bool outB_state = LOW;
bool outC_state = LOW;
bool outD_state = LOW;

bool led_state = LOW;

//boolean requestACK = false;
RFM69 radio;

SimpleTimer timer;

void resetInput1() {
  in1_ready = true;
}

void resetInput2() {
  in2_ready = true;
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  radio.initialize(FREQUENCY,NODEID,NETWORKID);
  radio.encrypt(ENCRYPTKEY);
  char buff[50];
  sprintf(buff, "\nTransmitting at %d Mhz...", FREQUENCY==RF69_433MHZ ? 433 : FREQUENCY==RF69_868MHZ ? 868 : 915);
  Serial.println(buff);
  
  timer.setTimer(1000, sendConnect, 5); // send connect ping every 1s for five times when first powered on
  
  pinMode(IN1, INPUT_PULLUP);
  pinMode(IN2, INPUT);
  pinMode(OUTA, OUTPUT);
  pinMode(OUTB, OUTPUT);
  pinMode(OUTC, OUTPUT);
  pinMode(OUTD, OUTPUT);

  pinMode(LED, OUTPUT); //debug

  readMEM(); //Get default vaules from EEPROM if they are set
}

void readMEM() {
  // Retrieve default states from EEPROM
  // 0 = LOW/false, 1 = HIGH/true, 2 = disabled
  int thisRead = EEPROM.read(MEMoutADefault);
  // value returned is 255 if it has never been written to
  if (thisRead != 255)
  {
    outA_enabled = (thisRead == 2 ? false : true);
    outA_state = (thisRead == 2 ? LOW : thisRead);
  }
  thisRead = EEPROM.read(MEMoutBDefault);
  if (thisRead != 255)
  {
    outB_enabled = (thisRead == 2 ? false : true);
    outB_state = (thisRead == 2 ? LOW : thisRead);
  }
  thisRead = EEPROM.read(MEMoutCDefault);
  if (thisRead != 255)
  {
    outC_enabled = (thisRead == 2 ? false : true);
    outC_state = (thisRead == 2 ? LOW : thisRead);
  }
  thisRead = EEPROM.read(MEMoutDDefault);
  if (thisRead != 255)
  {
    outD_enabled = (thisRead == 2 ? false : true);
    outD_state = (thisRead == 2 ? LOW : thisRead);
  }
  thisRead = EEPROM.read(MEMin1Default);
  if (thisRead != 255)
  {
    in1_enabled = (thisRead == 2 ? false : true);
  }
  thisRead = EEPROM.read(MEMin2Default);
  if (thisRead != 255)
  {
    in2_enabled = (thisRead == 2 ? false : true);
  }
}

void setPortEnabled(char port, char state) {
  bool enabled;
  bool portState;

  switch(state) {
    case 'X':
      portState = LOW;
      enabled = false;
      break;
    case 'N':
      portState = HIGH;
      enabled = true;
      break;
    case 'F':
      portState = LOW;
      enabled = true;
      break;
  }

  switch(port) {
    case '1':
      in1_enabled = enabled;
      EEPROM.write(MEMin1Default, in1_enabled);
      break;
    case '2':
      in2_enabled = enabled;
      EEPROM.write(MEMin2Default, in2_enabled);
      break;
    case 'A':
      outA_enabled = enabled;
      outA_state = portState;
      EEPROM.write(MEMoutADefault, outA_enabled);
      setOutput(port);
      break;
    case 'B':
      outB_enabled = enabled;
      outB_state = portState;
      EEPROM.write(MEMoutBDefault, outB_enabled);
      setOutput(port);
      break;
    case 'C':
      outC_enabled = enabled;
      EEPROM.write(MEMoutCDefault, outC_enabled);
      outC_state = portState;
      setOutput(port);
      break;
    case 'D':
      outD_enabled = enabled;
      outD_state = portState;
      EEPROM.write(MEMoutDDefault, outD_enabled);
      setOutput(port);
      break;
  }

}

void setOutput(char port) {
  switch(port) {
    case 'A':
      digitalWrite(OUTA, outA_state);
      break;
    case 'B':
      digitalWrite(OUTB, outB_state);
      break;
    case 'C':
      digitalWrite(OUTC, outC_state);
      break;
    case 'D':
      digitalWrite(OUTD, outD_state);
      break;
  }
}

void outputToggle(char port) {
  switch(port) {
    case 'A':
      outA_state = !outA_state;
      break;
    case 'B':
      outB_state = !outB_state;
      break;
    case 'C':
      outC_state = !outC_state;
      break;
    case 'D':
      outD_state = !outD_state;
      break;
  }
  
  setOutput(port);
}

void outputOn(char port) {
  switch(port) {
    case 'A':
      outA_state = HIGH;
      break;
    case 'B':
      outB_state = HIGH;
      break;
    case 'C':
      outC_state = HIGH;
      break;
    case 'D':
      outD_state = HIGH;
      break;
  }
  
  setOutput(port);
}

void outputOff(char port) {
  switch(port) {
    case 'A':
      outA_state = LOW;
      break;
    case 'B':
      outB_state = LOW;
      break;
    case 'C':
      outC_state = LOW;
      break;
    case 'D':
      outD_state = LOW;
      break;
  }
  
  setOutput(port);
}

void outputBlink(char port, int ms) {
  int n = 10; // do 10 times, should change later.
  switch(port) {
    case 'A':
      timer.setTimer(ms, outABlink, n);
      break;
    case 'B':
      timer.setTimer(ms, outBBlink, n);
      break;
    case 'C':
      timer.setTimer(ms, outCBlink, n);
      break;
    case 'D':
      timer.setTimer(ms, outDBlink, n);
      break;
  }
}

void outABlink() {
  outA_state = !outA_state;
  setOutput('A');
}

void outBBlink() {
  outB_state = !outB_state;
  setOutput('B');
}

void outCBlink() {
  outC_state = !outC_state;
  setOutput('C');
}

void outDBlink() {
  outD_state = !outD_state;
  setOutput('D');
}

void Blink() {
  digitalWrite(LED, led_state);
  led_state = !led_state;
}

void sendConnect() {
  // Send ping so gateway can poll connected nodes
  radio.send(GATEWAYID, "C", 1);
}

void loop() {
  
  timer.run();

  //process any serial input
  if (Serial.available() > 0)
  {
    char input = Serial.read();

    if (input == 'r') //d=dump register values
      radio.readAllRegs();
    /*
    if (input == 'E') //E=enable encryption
      radio.encrypt(KEY);
    if (input == 'e') //e=disable encryption
      radio.encrypt(null);
    if (input == 'i')
    {
      Serial.print("DeviceID: ");
      word jedecid = flash.readDeviceId();
      Serial.println(jedecid, HEX);
    }
    */
  }

  //check for any received packets
  if (radio.receiveDone())
  {
    if (radio.ACKRequested())
    {
      radio.sendACK();
      //Serial.print(" - ACK sent");
    }
    //Serial.println();
    
    // S for Setup, O for Output
    if (radio.DATA[0] == 'S')
    {
      // Setup string is in format 'S1N'
      //                            012
      // 0: S for Setup
      // 1: 1,2,A,B,C,D port number
      // 2: N for On, F for Off, X for disabled
      char port = radio.DATA[1];
      char state = radio.DATA[2];
      setPortEnabled(port, state);
      timer.setTimer(100, Blink, 4); //Blink twice at 100ms
      
    }
    else if (radio.DATA[0] == 'O')
    {
      // Output string is in format 'OAN#####'
      //                             01234567
      // 0: O for Output
      // 1: A, B, C, D port number
      // 2: N for On, F for Off
      // 3-7: ABCDE hex for blink cycle time
      char port = radio.DATA[1];
      char state = radio.DATA[2];
      char hex[5] = {radio.DATA[3], radio.DATA[4], radio.DATA[5], radio.DATA[6], radio.DATA[7]};
      timer.setTimer(100, Blink, 2); //Blink once at 100ms
    }
  }

  //check inputs
  if (in1_ready && in1_enabled)
  {
    if (digitalRead(IN1) == LOW)
    {
      in1_ready = false;
      
      // send radio response with confirmation
      // I for Input
      // 1 for IN1
      // N for ON / F for OFF
      if (radio.sendWithRetry(GATEWAYID, "I:1F", 3))
      {
        Serial.print(" ok!");
        timer.setTimeout(IN1_DEBOUNCE, resetInput1);
      }
      else
      {
        Serial.print(" nothing...");
      }
    }
  }
  
  if (in2_ready && in2_enabled)
  {
    if(digitalRead(IN2) == HIGH)
    {
      in2_ready = false;
      
      // send radio response with confirmation
      // I for Input
      // 2 for IN2
      // N for ON / F for OFF
      if (radio.sendWithRetry(GATEWAYID, "I:2N", 3))
      {
        Serial.print(" ok!");
        timer.setTimeout(IN2_DEBOUNCE, resetInput2);
      }
      else
      {
        Serial.print(" nothing...");
      }
    }
  }
}


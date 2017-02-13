// Sample RFM69 receiver/gateway sketch, with ACK and optional encryption
// Passes through any wireless received messages to the serial port & responds to ACKs
// It also looks for an onboard FLASH chip, if present
// Library and code by Felix Rusu - felix@lowpowerlab.com
// Get the RFM69 and SPIFlash library at: https://github.com/LowPowerLab/

#include <RFM69.h>    //get it here: https://www.github.com/lowpowerlab/rfm69
#include <SPI.h>
//#include <SPIFlash.h> //get it here: https://www.github.com/lowpowerlab/spiflash
#include <SimpleTimer.h>
//#include "enums.h"
#include <PCAction.h>
#include <PCTrigger.h>
#include <PCEvent.h>

#define NODEID        1    //unique for each node on same network
#define NETWORKID     100  //the same on all nodes that talk to each other
//Match frequency to the hardware version of the radio on your Moteino (uncomment one):
//#define FREQUENCY     RF69_433MHZ
//#define FREQUENCY     RF69_868MHZ
#define FREQUENCY     RF69_915MHZ
#define ENCRYPTKEY    "FH62kz80Pfehl752" //exactly the same 16 characters/bytes on all nodes!
#define ACK_TIME      30 // max # of ms to wait for an ack
#define SERIAL_BAUD   115200
#define MAX_EVENTS    100 // the maximum number of events this code can support
#define MAX_NODES     100 // the macimum number of connected nodes that this code can support

#ifdef __AVR_ATmega1284P__
  #define LED           15 // Moteino MEGAs have LEDs on D15
  #define FLASH_SS      23 // and FLASH SS on D23
#else
  #define LED           9 // Moteinos have LEDs on D9
  #define FLASH_SS      8 // and FLASH SS on D8
#endif

RFM69 radio;
//SPIFlash flash(FLASH_SS, 0xEF30); //EF30 for 4mbit  Windbond chip (W25X40CL)
bool promiscuousMode = false; //set to 'true' to sniff all packets on the same network
String inputString; //string to hold the incoming serial data
bool stringComplete = false; //whether the string is complete
bool led_state = LOW;

SimpleTimer timer;

struct Node {
  bool is_connected;
  bool input_state[3]; // Index 0=unused, 1=port1, 2=port2
};
// Array to hold controller ids of connected nodes
// NOTE hard coded to MAX of 100 nodes, must ensure node id is <100
Node nodes_connected[MAX_NODES];

// Array to hold pointers to events where array index is event_id
// NOTE hard coded to MAX of 100 events, must ensure event id is <100 in python
PCEvent* events[MAX_EVENTS];

void setup() {
  pinMode(LED, OUTPUT); //debug
  Serial.begin(SERIAL_BAUD);
  delay(10);
  inputString.reserve(100); //reserve 100 Bytes for inputString
  radio.initialize(FREQUENCY,NODEID,NETWORKID);
  radio.encrypt(ENCRYPTKEY);
  radio.promiscuous(promiscuousMode);
  //char buff[50];
  //sprintf(buff, "\nListening at %d Mhz...", FREQUENCY==RF69_433MHZ ? 433 : FREQUENCY==RF69_868MHZ ? 868 : 915);
  //Serial.println(buff);

  timer.setInterval(1000, pingConnected); //Set timer to ping connected nodes every 1s
}

void pingConnected() {
  // Ping nodes previously reported as connected
  // Then write to serial list of currently connecetd nodes
  // C:#.#.#....
  String cmd = "C:" + String(NODEID); //Include gateway node (this id) first
  //Start at 2 since gateway is node id 1
  for (int i=2; i<MAX_NODES; i++)
  {
    if (nodes_connected[i].is_connected)
    {
      if (radio.sendWithRetry(i, "ACK TEST", 8, 0))
      {
        nodes_connected[i].is_connected = true;
        cmd = cmd + "." + i;
      }
      else
      {
        nodes_connected[i].is_connected = false;
      }
    }
  }
  //Serial.println(cmd);
}

void Blink() {
  led_state = !led_state;
  digitalWrite(LED, led_state);
}

void loop() {
  
  timer.run(); // update timer for pinging connected nodes
  
  // process any serial input
  if (stringComplete)
  {
    // expecting string in the format
    // E=trigger;action:action:action
    String cmdType = getValue(inputString, '=', 0);
    String cmd = getValue(inputString, '=', 1);

    if (cmdType == "E")
    {
      // create new event instance
      PCEvent* event_ptr = NULL;
      event_ptr = new PCEvent;

      // split the string into the trigger and list of actions
      String TriggerString = getValue(cmd, ';', 0);
      String ActionsString = getValue(cmd, ';', 1);

      // create new trigger instance and split the trigger parameters on '.'
      String type = getValue(TriggerString, '.', 0);
      int cid = getValue(TriggerString, '.', 1).toInt();
      int port_num = getValue(TriggerString, '.', 2).toInt();
      String param1 = getValue(TriggerString, '.', 3);
      int param2 = getValue(TriggerString, '.', 4).toInt();

      // create new Trigger instance and call the correct constructor
      PCTrigger* trigger_ptr = NULL;

      if (type == "I") {
        bool state = (param1 == "ON" ? true : false);
        trigger_ptr = new PCTrigger(cid, port_num, state); // create trigger instance with the input constructor
      } else if (type == "E") {
        trigger_ptr = new PCTrigger(param1.toInt()); // create trigger instance with the every contructor
      } else if (type == "R") {
        trigger_ptr = new PCTrigger(param1.toInt(), param2); // create trigger instance with the random constructor
      }

      if (event_ptr != NULL && trigger_ptr != NULL)
      {
        event_ptr->SetTrigger(trigger_ptr);
      }

      // split the actions on ':' and then split the parameters on '.'
      bool more = true; // flag to exit while loop when no more delimiters found
      int i = 0; // for counting delimiters when separating actions
      while (more)
      {
        String ActionString = getValue(ActionsString, ':', i);
        i++;

        if (ActionString == "") // no colon found
        {
          more = false;
        }
        else
        {
          int delay_ms = getValue(ActionString, '.', 0).toInt();
          int cid = getValue(ActionString, '.', 1).toInt();
          String type = getValue(ActionString, '.', 2);
          String port_name = getValue(ActionString, '.', 3);
          int param = getValue(ActionString, '.', 4).toInt();
  
          // create new Action instance and call the correct constructor
          PCAction* action_ptr = NULL;
          
          if (type == "N") {
            action_ptr = new PCAction(delay_ms, true, cid, port_name); // On/off constructor
          } else if (type == "F") {
            action_ptr = new PCAction(delay_ms, false, cid, port_name); // On/off constructor
          } else if (type == "T") {
            action_ptr = new PCAction(delay_ms, cid, port_name); // Toggle constructor
          } else if (type == "B") {
            action_ptr = new PCAction(delay_ms, param, cid, port_name); // Blink constructor
          } else if (type == "S") {
            action_ptr = new PCAction(delay_ms, param, cid); // Sound constructor
          }
          if (event_ptr != NULL && action_ptr != NULL)
          {
            event_ptr->AddAction(action_ptr);
          }
        }
      }
      // add this event to event pointer array
      if (event_ptr != NULL)
      {
        events[event_ptr->GetID()] = event_ptr;
      }
    }
    else if (cmdType == "S")
    {
      // split the string on ':'
      int cid = getValue(cmd, ':', 0).toInt();
      String setup_cmd = getValue(cmd, ':', 1);
      char sendCmd[setup_cmd.length()+1];
      setup_cmd.toCharArray(sendCmd, setup_cmd.length()+1);
      radio.sendWithRetry(cid, sendCmd, 3, 2);
    }
    inputString = ""; //clear the string
    stringComplete = false;
  }

  // process any incoming radio data
  if (radio.receiveDone())
  {
    byte inputNode = radio.SENDERID;

    //Serial.println(radio.DATA); // Send radio data to pi serial

    if (radio.DATA[0]=='C') // if the message starts with 'C' for Connect
    {
      nodes_connected[inputNode].is_connected = true;
      timer.setTimer(50, Blink, 2); // blink once at 50ms
    }
    else if (radio.DATA[0] == 'I') // if the message starts with 'I' for Input
    {
      int portnum;
      if (radio.DATA[2] == '1') { portnum = 1; }
      if (radio.DATA[2] == '2') { portnum = 2; }
      timer.setTimer(100, Blink, (portnum * 2));
      nodes_connected[inputNode].input_state[portnum] = (radio.DATA[3] == 'N' ? true : false);
    }
    
    if (radio.ACKRequested())
    {
      // When a node requests an ACK, respond to the ACK
      byte theNodeID = radio.SENDERID;
      radio.sendACK();
      //Serial.print(" - ACK sent.");
    }
  }

  // iterate through each event and handle any triggers
  for (int i=0; i<MAX_EVENTS; i++)
  {
    PCEvent* event_ptr;
    if (event_ptr = events[i]) // if an event with this id exists (non NULL in array)
    {
      PCTrigger* trigger_ptr = event_ptr->GetTrigger(); // get the trigger for this event
      if (trigger_ptr) { // protect the pointer
        if (trigger_ptr->GetType() == 'I') { // if this is an input trigger
          if (nodes_connected[i].input_state[trigger_ptr->GetPort()] == trigger_ptr->GetState()) { // if this input should be triggered
            trigger_ptr->SetTriggered();
          }
        }
        event_ptr->GetTrigger()->Update(); // Update the triggers (tick)
        if (event_ptr->GetTrigger()->IsTriggered()) { // if trigger has fired
          RunActions(event_ptr); // run the actions in this event
          event_ptr->GetTrigger()->Reset(); // reset the trigger to its non-triggered state
        }
      }
    }
  }
}

// Runs all the actions in a given event
// Actions send via radio string in the format: OAN????
// O for Output
// A,B,C,D for port name
// N,F,B,T,S for On, Off, Blink, Toggle, Sound
// ??? for cycle time in ms for blinking
void RunActions(PCEvent* event)
{
  int count = 0;
  PCAction* this_action = event->GetAction(0); // get the first action on this trigger
  while (this_action != NULL)
  {
    String cmd = "";
    int delay_in_ms = this_action->GetDelay();
    int cid = this_action->GetCID();
    String at = this_action->GetType();
    if (at == "N") {
      bool turn_to_state = this_action->GetState();
      String port_name = this_action->GetPort();
      cmd = "O" + port_name + (turn_to_state ? "N" : "F");
    } else if (at == "B") {
      String port_name = this_action->GetPort();
      int blink_ms = this_action->GetCycleTime();
      cmd = "O" + port_name + "B" + String(blink_ms);
   } else if (at == "T") {
      String port_name = this_action->GetPort();
      cmd = "O" + port_name + "T";
    } else if (at == "S") {
      //play sound here
    }
    if (cmd != "") {
      char sendCmd[cmd.length()];
      cmd.toCharArray(sendCmd, cmd.length());
      radio.sendWithRetry(cid, sendCmd, 4, 0);
    }
    count++; // increment the counter to get the next action
    this_action = event->GetAction(count);
  }
}

// Function that returns a single String separated by a predefined character at a given index
// Returns empty string "" if none found
String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length()-1;

  for(int i=0; i<=maxIndex && found<=index; i++){
    if(data.charAt(i)==separator || i==maxIndex){
        found++;
        strIndex[0] = strIndex[1]+1;
        strIndex[1] = (i == maxIndex) ? i+1 : i;
    }
  }

  return found>index ? data.substring(strIndex[0], strIndex[1]) : "";
}

/*
  SerialEvent occurs whenever a new data comes in the
 hardware serial RX.  This routine is run between each
 time loop() runs, so using delay inside loop can delay
 response.  Multiple bytes of data may be available.
 */
void serialEvent() {
  while (Serial.available())
  {
    // get the new byte:
    char inChar = (char)Serial.read();
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n')
    {
      stringComplete = true;
    }
    // add it to the inputString:
    if (stringComplete == false)
    {
      inputString += inChar;    
    }
  }
}

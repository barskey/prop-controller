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
  bool input1_state;
  bool input2_state;
};
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
  String cmd = "C:" + NODEID; //Include gateway node (this id) first
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
  Serial.println(cmd);
}

void Blink() {
  digitalWrite(LED, led_state);
  led_state = !led_state;
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
    /*
    else if (cmdType == "S")
    {
      // Expecting colon delimited string - first value is node id, second is command
      splitIndex = theCmdS.indexOf(":");
      if (splitIndex != 255) //make sure colon is found
      {
        byte nodeID = theCmdS.substring(0, splitIndex).toInt(); //Get the sender ID as the first chars before ':'
        String newCmdS = theCmdS.substring(splitIndex+1); //Get the rest of the chars after the ':'
        byte cmdLen = newCmdS.length() + 1; //Length of the string plus null terminator
        char newCmd[cmdLen]; //Buffer for converting to char Array
        newCmdS.toCharArray(newCmd, cmdLen); //Convert String to char array so it can be sent
        
        String tmp = newCmdS.substring(0, 3);
        radio.send(nodeID, newCmd, 3);
        if (tmp == "SAN") {
          timer.setTimer(100, Blink, 2); //Blink once at 100ms
        }
        if (tmp == "SAF") {
          timer.setTimer(500, Blink, 2); //Blink once at 500ms
        }
        if (tmp == "SAX") {
          timer.setTimer(1000, Blink, 2); //Blink once at 1000ms
        }
        //Serial.println("Gateway:" + tmp);
      }
    }
    */
    inputString = ""; //clear the string
    stringComplete = false;
  }

  // process any incoming radio data
  if (radio.receiveDone())
  {
    byte inputNode = radio.SENDERID;

    //Serial.println(radio.DATA); // Send radio data to pi serial

    if (radio.DATA[0]=='C') // check if the message starts with 'C' for Connect
    {
      nodes_connected[inputNode].is_connected = true;
      timer.setTimer(3, Blink, 2); //Blink once at 3ms
    }
    else if (radio.DATA[0] == 'I') // check if the message starts with 'I' for Input
    {
      if (radio.DATA[2] == '1') // for input 1
      {
        nodes_connected[inputNode].input1_state = (radio.DATA[3] == 'F' ? false : true);
      }
      else if (radio.DATA[2] == '2') // for input 2
      {
        nodes_connected[inputNode].input1_state = (radio.DATA[3] == 'N' ? true : false);
      }
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
      event_ptr->GetTrigger()->Update(); // Update the triggers (tick)
      if (event_ptr->GetTrigger()->IsTriggered()) { // if trigger has fired
        RunActions(event_ptr); // run the actions in this event
        event_ptr->GetTrigger()->Reset(); // reset the trigger to its non-triggered state
      }
    }
  }
}

// Runs all the actions in a given event
void RunActions(PCEvent* event)
{
  int count = 0;
  PCAction* this_action = event->GetAction(0); // get the first action on this trigger
  while (this_action != NULL)
  {
    int delay_in_ms = this_action->GetDelay();
    String at = this_action->GetType();
    if (at == "N") {
      bool turn_to_state = this_action->GetState();
      String port_name = this_action->GetPort();
      String cmd = "O" + port_name + (turn_to_state ? "N" : "F");
      int cid = this_action->GetCID();
      radio.sendWithRetry(cid, cmd, 4, 0));
    } else if (at == "B") {
      String port_name = this_action->GetPort();
      int blink_ms = this_action->Get
      String cmd = "O" + port_name + ("B") + ;
      int cid = this_action->GetCID();
      radio.sendWithRetry(cid, cmd, 4, 0));
    } else if (at == "T") {
      String port_name = this_action->GetPort();
      int cid = this_action->GetCID();
    } else if (at == "S") {
      //play sound here
    }
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

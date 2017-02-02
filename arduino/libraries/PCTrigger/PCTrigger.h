/*
 * PCTrigger.h - Library for Arduino to create PCTrigger class
 * Used for prop-controller sketch to store parameters and conditions for
 * each PCTrigger called by an Event.
*/

// ensure this library description is only included once
#ifndef PCTrigger_h
#define PCTrigger_h

#include <SimpleTimer.h>

enum TriggerType {
	INPUT_TT,
	EVERY_TT,
	RANDOM_TT,
	EVENT_TT
};

class PCTrigger
{
	public:
		// constructors:
		PCTrigger(int controller_id, int controller_port, bool port_state); // Input turns on or off
		PCTrigger(int repeat_in_ms); // Repeat Every xx ms
		PCTrigger(int random_from, int random_to); // Randomnly every xx ms between from and to
		PCTrigger(int event_id, bool junk); // After Event completes (junk bool added to keep constructor unique)

		// Updates this trigger each loop iteration (tick)
		void Update();
		
		// Returns trigger status - true if triggered, false if not
		bool IsTriggered();
		
		// Resets trigger status
		void Reset();

	private:
		int _controller_id; // controller id that trigger takes place on
		int _controller_port; // port name that trigger takes place on
		bool _port_state; // on/off state to check for this trigger
		int _random_from; // value in ms for lower range of random trigger
		int _random_to; // value in ms for upper range of random trigger
		int _event_id; // event id after which this trigger will fire
		TriggerType _type; // what type of trigger this is

		int _timer_value; // time in ms to fire timer
		bool _trigger_state = false; // Whether this trigger has fired or not
		unsigned long _prev_millis; // stores time in ms that timer was started

		// Sets random value for setting timer
		int GetRandTimer(); 
		
		// Handle events to occure when timer fires
		void TimerFired();
};

#endif

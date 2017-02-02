/*
 * PCAction.h - Library for Arduino to create Action class
 * Used for prop-controller sketch to store parameters and conditions for
 * each Action called by an Event.
*/

// ensure this library description is only included once
#ifndef PCAction_h
#define PCAction_h

class PCAction
{
	public:
		// constructors: // TODO do I need action ids?
		PCAction(int delay_in_ms, bool turn_to_state, int controller_id, String controller_port); // Turn on or off
		PCAction(int delay_in_ms, int cycle_in_ms, int controller_id, String controller_port); // Blink
		PCAction(int delay_in_ms, int sound_id, int controller_id); // Play Sound
		PCAction(int delay_in_ms, int controller_id, String controller_port); // Toggle

		// Getters
		int GetID();
		int GetDelay();
		int GetCID();
		String GetPort();
		int GetCycleTime();
		bool GetState();
		int GetSoundID();
		String GetType();
		
	private:
		int _action_id; // Action id for this action TODO do I need action ids?
		int _delay_in_ms; // delay in ms before this action starts
		int _controller_id; // controller id that action takes place on
		String _controller_port; // port name that action takes place on
		int _cycle_in_ms; // time in ms to repeat blink actions
		bool _turn_to_state; // on/off state to set port
		int _sound_id; // sound id of sound to play
		
		String _type; // what type of action this is
};

#endif

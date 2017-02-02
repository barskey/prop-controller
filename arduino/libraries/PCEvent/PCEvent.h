/*
 * PCEvent.h - Library for Arduino to create Event class
 * Used for prop-controller sketch to store actions and triggers
*/

// ensure this library description is only included once
#ifndef PCEvent_h
#define PCEvent_h

// forward declarations
class PCTrigger;
class PCAction;

typedef struct action_node
{
	PCAction* val;
	struct action_node* next;
};

class PCEvent
{
	public:
		// constructor
		PCEvent();
		
		// destructor
		~PCEvent();
		
		// Add a trigger pointer to this event
		void SetTrigger(PCTrigger* trigger_to_add);
		
		// Add an action pointer to the end of the action list
		void AddAction(PCAction* action_to_add);
		
		// Returns the trigger (getter)
		PCTrigger* GetTrigger();
		
		// Returns the action at index i (assuming zero based)
		PCAction* GetAction(int i);
		
		// Returns the event id (getter)
		int GetID();
		
	private:
		int _event_id;
		action_node* _head;
		PCTrigger* _trigger;
};

#endif

/*
 * PCEvent.cpp - Library for Arduino to create MyPCEvent class
 * Used for prop-controller sketch to store actions and triggers
*/

#include "PCTrigger.h"
#include "PCAction.h"
#include "PCEvent.h" // must be last

/*
 * Constructor.
*/
PCEvent::PCEvent()
{
	_event_id = 1;
	
	_head = new action_node;
	_trigger = NULL;
}

/*
 * Destructor.
*/
PCEvent::~PCEvent()
{
	// delete the trigger to free memory
	
	// delete all the actions to free memory
	action_node* current = _head;
	action_node* next_node = NULL;
	while (current != NULL)
	{
		next_node = current->next;
		delete current;
		current = next_node;
	}
}

PCTrigger* PCEvent::GetTrigger()
{
	return _trigger;
}

void PCEvent::SetTrigger(PCTrigger* trigger_to_add)
{
	_trigger = trigger_to_add;
}

void PCEvent::AddAction(PCAction* action_to_add)
{
    action_node* current = _head;
    while (current->next != NULL)
	{
        current = current->next;
    }

    /* now we can add a new variable */
    current->next = new action_node;
    current->next->val = action_to_add;
    current->next->next = NULL;
}

PCAction* PCEvent::GetAction(int i)
{
	action_node* current = _head;
	int count = 0;
	
	while (current != NULL)
	{
		if (count == i) { return current->val; }
		current = current->next;
		count++;
	}
	
	return NULL;
}

int PCEvent::GetID()
{
	return _event_id;
}
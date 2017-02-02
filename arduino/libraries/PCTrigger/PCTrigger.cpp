/*
 * PCTrigger.cpp - Library for Arduino to create PCTrigger class
 * Used for prop-controller sketch to store parameters and conditions for
 * each PCTrigger called by an Event.
*/

#include "PCTrigger.h"

static inline unsigned long elapsed() { return millis(); }

/*
 * Check Input constructor.
*/
PCTrigger::PCTrigger(int controller_id, int controller_port, bool port_state)
{
	_controller_id = controller_id;
	_controller_port = controller_port;
	_port_state = port_state;
	_type = INPUT_TT;
	
	Reset();
}

/*
 * Repeat constructor.
*/
PCTrigger::PCTrigger(int repeat_in_ms)
{
	_timer_value = repeat_in_ms;
	_type = EVERY_TT;
	
	Reset();
}

/*
 * Random constructor.
*/
PCTrigger::PCTrigger(int random_from, int random_to)
{
	_random_from = random_from;
	_random_to = random_to;
	_type = RANDOM_TT;
	
	Reset();
}
 
/*
 * Event constructor.
*/
PCTrigger::PCTrigger(int event_id, bool junk)
{
	_event_id = event_id;
	_type = EVENT_TT;
	
	Reset();
}

/*
* Update this trigger each loop iteration
*/
void PCTrigger::Update()
{
	if (elapsed() - _prev_millis >= _timer_value) // timer has reached end
	{
		TimerFired();
	}
}

/*
* Returns true when this trigger was fired
*/
bool PCTrigger::IsTriggered()
{
	return _trigger_state;
}

void PCTrigger::TimerFired()
{
	_trigger_state = true;
}

void PCTrigger::Reset()
{
	_trigger_state = false;
	
	_prev_millis = elapsed();
	
	if (_type == RANDOM_TT) { // set timer value to a random value each time it runs
		_timer_value = GetRandTimer();
	}
}

int PCTrigger::GetRandTimer()
{
	return (rand() % (_random_to - _random_from) + _random_from);
}
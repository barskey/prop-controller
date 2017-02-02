/*
 * PCAction.cpp - Library for Arduino to create PCAction class
 * Used for prop-controller sketch to store parameters and conditions for 
 * each PCAction called by an Event.
*/

#include <Arduino.h>
#include "PCAction.h"

/*
 * Turn On/Off constructor.
*/
 PCAction::PCAction(int delay_in_ms, bool turn_to_state, int controller_id, String controller_port)
 {
	_delay_in_ms = delay_in_ms;
	_turn_to_state = turn_to_state;
	_controller_id = controller_id;
	_controller_port = controller_port;
	_action_id = 1;
	_type = "N";
 }

/*
 * Blink constructor.
*/
PCAction::PCAction(int delay_in_ms, int cycle_in_ms, int controller_id, String controller_port)
 {
	_delay_in_ms = delay_in_ms;
	_cycle_in_ms = cycle_in_ms;
	_controller_id = controller_id;
	_controller_port = controller_port;
	_action_id = 1;
	_type = "B";
 }

/*
 * Play Sound constructor.
*/
PCAction::PCAction(int delay_in_ms, int sound_id, int controller_id)
{
	_delay_in_ms = delay_in_ms;
	_sound_id = sound_id;
	_controller_id = controller_id;
	_action_id = 1;
	_type = "S";
}

/*
 * Toggle constructor.
*/
PCAction::PCAction(int delay_in_ms, int controller_id, String controller_port)
{
	_delay_in_ms = delay_in_ms;
	_controller_id = controller_id;
	_controller_port = controller_port;
	_action_id = 1;
	_type = "T";
}

int PCAction::GetID()
{
	return _action_id;
}

int PCAction::GetDelay()
{
	return _delay_in_ms;
}

int PCAction::GetCID()
{
	return _controller_id;
}

String PCAction::GetPort()
{
	return _controller_port;
}

int PCAction::GetCycleTime()
{
	return _cycle_in_ms;
}

bool PCAction::GetState()
{
	return _turn_to_state;
}

int PCAction::GetSoundID()
{
	return _sound_id;
}

String PCAction::GetType()
{
	return _type;
}

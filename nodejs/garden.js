// Load modules
var EventEmitter = require("events");
var Gpio = require('./gpio.js');
var interval = 30;
var gpio = new Gpio(interval);

// Declare garden object

var garden = {};
var locked = false;
var impulsesPerLiter = 450;

garden.gpio = gpio;

// Actions

garden.reset = function() {
    locked = false;
    garden.stopSimulateQuantity();
    for(var i in gpio.relays) {
        gpio.relays[i].set(0);
    }
}

garden.spray = function(zone, liters) {    
    return new Promise((resolve, reject) => {
        if(locked) {
            reject('Locked');
        } else {
            locked = true;
            
            var spray = gpio.relays['spray' + zone];
            var promise = new Promise((resolve, reject) => {
                // Activate spray 1
                spray.set(1);

                gpio.sensors.quantity = 0;

                gpio.events.addListener('sensor.quantity', onQuantityChange);
                                        
                function onQuantityChange(name, value) {
                    if(value >= liters * impulsesPerLiter) {
                        gpio.events.removeListener('sensor.quantity', onQuantityChange);
                        resolve();
                    }
                }
            });
            
            promise.then(() => {
                spray.set(0);
                locked= false;
                
                resolve();
            });
        }
    });
}

garden.switchLight = function(zone) {
    var relay = gpio.relays['light' + zone];
    relay.set(1 - relay.get());
}

// Tests

var timer;

garden.simulateQuantity = function(liters) {
    return new Promise((resolve, reject) => {
        var iter = 0, iterMax = (liters * impulsesPerLiter) * 2;
        clearInterval(timer);
        timer = setInterval(toggle, interval);
        gpio.relays.quantity.set(0);
        function toggle() {
            gpio.relays.quantity.set(1 - gpio.relays.quantity.get());
            console.log(iter);
            if(iter >= iterMax) {
                clearInterval(timer);
                resolve();
            }
            iter ++;
        }
    });
}

garden.stopSimulateQuantity = function() {
    clearInterval(timer);
    garden.gpio.relays.quantity.set(0);
}

garden.simulateLowLevel = function(value) {
    garden.gpio.relays.lowLevel.set(1);
}

module.exports = garden;
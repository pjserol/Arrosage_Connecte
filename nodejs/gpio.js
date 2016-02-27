var EventEmitter = require("events");
var Gpio = require("gpio");


function internal(interval) {

    // Sensors

    var emitter = new EventEmitter();

    var sensors = {
        quantity: 0,
        lowLevel: 0
    };
    this.sensors = sensors;

    // Quantity sensor
    var gpio27 = Gpio.export(27, {
        direction: 'in',
        interval: interval,
        ready: () => {
            gpio27.on("change", (val) => {
                if (val == 1) {
                    sensors.quantity++;
                    emitter.emit("sensor.quantity", "quantity", this.sensors.quantity);
                }
            });
        }
    });

    // Low level sensor
    var gpio17 = Gpio.export(17, {
        direction: 'in',
        interval: interval,
        ready: () => {
            gpio17.on("change", (val) => {
                sensors.lowLevel = val;
                if(val === 1) {
                    relays.master.set(0);
                } else if(openValves > 0) {
                    relays.master.set(1);
                }
                emitter.emit("sensor.lowLevel", 'lowLevel', val);
            });
        }
    });

    this.events = emitter;

    // Relays

    var relays = {};
    this.relays = relays;
    
    var openValves = 0;
    
    function changeOpenValves(delta) {
        openValves += delta;
        if(openValves > 0) {
            relays.master.set(1);
        } else {
            relays.master.set(0);
        }
    }
    
    function valveSetFunc(v) {
        if(v === 1) {
            changeOpenValves(1);
        } else {
            changeOpenValves(-1);
        }
    }
    
    function createRelay(name, b, setFunc, setCondition) {
        console.log('Enabling relay ' + name + '(' + b + ')...');
        var value = 0;
        var gpio = Gpio.export(b, {
            direction: 'out',
            ready: function () {
                console.log('relay ' + name + ' ready');
            }
        });
        relays[name] = {
            set: (v) => {
                if(setCondition == null || setCondition(v)) {
                    gpio.set(v);
                    if(value != v) {
                        value = v;
                        if(setFunc) {
                            setFunc(v);
                        }
                        emitter.emit('relay.' + name, name, value);
                    }
                }
            },
            get: () => {
                return value;
            }
        };
    }

    // Master
    createRelay('master', 4, null, (v) => {
        return v === 0 || sensors.lowLevel === 0;
    });

    // Spray 1
    createRelay('spray1', 23, valveSetFunc);

    // Spray 2
    createRelay('spray2', 24, valveSetFunc);

    // Spray 3
    createRelay('spray3', 25, valveSetFunc);

    // Light 1
    createRelay('light1', 28);

    // Light 2
    createRelay('light2', 29);

    // Light 3
    createRelay('light3', 30);

    // Reserve
    createRelay('reserve', 31);

    // Sensor simulation

    // Quantity sensor
    createRelay('quantity', 22);

    // Low Level sensor
    createRelay('lowLevel', 18);
}

module.exports = internal;
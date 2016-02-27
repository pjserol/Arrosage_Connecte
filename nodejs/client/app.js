+ function () {
    var socket = io('http://192.168.20.103:8080');

    var vm = new Vue({
        el: '#app',
        data: {
            relays: [],
            sensors: [],
            buttons: [],
        },
        filters: {},
        methods: {
            spray: function (e) {
                console.log(e);
            },
            switchLight: function (e) {},
            test: function (e, i) {}
        },
        components: { //v-on="click: spray"
            'sensor': {
                template: '<div>{{label}} <b>{{value}}</b></div>'
            },
            'relay': {
                template: '<div>{{label}} <b>{{value}}</b> <button v-on="click: test(0)">OFF</button><button v-on="click: test(1)">ON</button></div>',
                methods: {
                    test: function (value) {
                        socket.emit('relay.' + this.name, value, function() {
                            console.log('set');
                        });
                    }
                },
            },
            'action-button': {
                template: '#action-button',
                methods: {
                    do: function() {
                        if(this.input) {
                            socket.emit('action.' + this.name, this.value, function(err) {
                                if(err) {
                                    alert(err);
                                }
                            });
                        } else {
                            socket.emit('action.' + this.name, function(err) {
                                if(err) {
                                    alert(err);
                                }
                            });
                        }
                    }
                }
            }
        }
    });

    function read() {
        socket.on('init', function (sensors, relays, buttons, cb) {
            vm.sensors.length = 0;
            for (var i in sensors) {
                ! function (i) {
                    var sensor = sensors[i];
                    var name = sensor.name;
                    sensor.value = 0;
                    socket.on('sensor.' + name, function (value) {
                        sensor.value = value;
                    });
                    vm.sensors.push(sensor);
                }(i);
            }
            
            vm.relays.length = 0;
            for (var i in relays) {
                ! function (i) {
                    var relay = relays[i];
                    var name = relay.name;
                    relay.value = 0;
                    socket.on('relay.' + name, function (value) {
                        relay.value = value;
                    });
                    vm.relays.push(relay);
                }(i);
            }
            
            vm.buttons = buttons;
            
            cb();
        });
    }

    read();
}();
document.addEventListener("DOMContentLoaded", function () {
    let uBitDevice;
    let rxCharacteristic;

    // Ensure Bluetooth connection is triggered by user gesture
    document.getElementById("connectBtn").addEventListener("click", connectMicrobit);

    async function connectMicrobit() {
        try {
            console.log("Requesting Bluetooth Device...");
            uBitDevice = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: "BBC micro:bit" }],
                optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] // UART service
            });

            console.log("Connecting to GATT Server...");
            const server = await uBitDevice.gatt.connect();

            console.log("Getting Service...");
            const service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");

            console.log("Getting Characteristics...");
            const txCharacteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
            rxCharacteristic = await service.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca9e");

            console.log("Bluetooth Connection Successful");
            updateUI(true);

            // Enable Notifications
            txCharacteristic.startNotifications();
            txCharacteristic.addEventListener("characteristicvaluechanged", onTxCharacteristicValueChanged);

            uBitDevice.addEventListener('gattserverdisconnected', onDisconnected);

        } catch (error) {
            console.error("Connection failed:", error);
        }
    }

    async function sendUART(command) {
        if (!rxCharacteristic) return;
        let encoder = new TextEncoder();
        queueGattOperation(() => 
            rxCharacteristic.writeValue(encoder.encode(command + "\n"))
                .then(() => console.log("Sent:", command))
                .catch(error => console.error("Error sending data:", error))
        );
    }

    let queue = Promise.resolve();
    function queueGattOperation(operation) {
        queue = queue.then(operation, operation);
        return queue;
    }

    function onTxCharacteristicValueChanged(event) {
        let receivedData = [];
        for (let i = 0; i < event.target.value.byteLength; i++) {
            receivedData[i] = event.target.value.getUint8(i);
        }
        const receivedString = String.fromCharCode.apply(null, receivedData);
        console.log("Received:", receivedString);
    }

    function onDisconnected(event) {
        console.log(`Device ${event.target.name} is disconnected.`);
        updateUI(false);
    }

    function updateUI(connected) {
        document.getElementById("connectBtn").disabled = connected;

        document.querySelectorAll(".btn, .slider").forEach(el => {
            el.disabled = !connected;
        });

        document.getElementById("robotShow")?.classList.toggle("robotShow_connected", connected);
    }

    // 🎮 Button Handling with Debounce
    const buttonMap = {
        "dpad-up": "UP",
        "dpad-down": "DOWN",
        "dpad-left": "LEFT",
        "dpad-right": "RIGHT",
        "triangle": "TRIANGLE",
        "square": "SQUARE",
        "circle": "O",
        "cross": "X"
    };

    let buttonCooldown = false;
    function sendButtonCommand(command) {
        if (buttonCooldown) return;
        buttonCooldown = true;
        sendUART(command);
        setTimeout(() => buttonCooldown = false, 100); // 100ms debounce
    }

    document.querySelectorAll(".btn").forEach(button => {
        button.addEventListener("mousedown", () => {
            const command = buttonMap[button.classList[1]];
            if (command) sendButtonCommand(command);
        });

        button.addEventListener("mouseup", () => {
            sendUART("STOP");
        });
    });

    // 🎚 Slider Handling with Throttling
    let lastSentLeft = 50, lastSentRight = 50;
    
    function sendSliderCommand(side, value) {
        if (side === "L" && Math.abs(value - lastSentLeft) < 5) return;
        if (side === "R" && Math.abs(value - lastSentRight) < 5) return;
        
        sendUART(`${side}_${value}`);
        if (side === "L") lastSentLeft = value;
        if (side === "R") lastSentRight = value;
    }

    document.querySelector(".left-slider").addEventListener("input", event => {
        sendSliderCommand("L", event.target.value);
    });

    document.querySelector(".right-slider").addEventListener("input", event => {
        sendSliderCommand("R", event.target.value);
    });
});

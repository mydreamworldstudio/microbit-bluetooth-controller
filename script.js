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

            document.getElementById("robotShow")?.classList.add("robotShow_connected");

            // Enable Notifications
            txCharacteristic.startNotifications();
            txCharacteristic.addEventListener("characteristicvaluechanged", onTxCharacteristicValueChanged);

            uBitDevice.addEventListener('gattserverdisconnected', onDisconnected);

        } catch (error) {
            console.error("Connection failed:", error);
        }
    }

    function disconnectMicrobit() {
        if (!uBitDevice) return;

        if (uBitDevice.gatt.connected) {
            uBitDevice.gatt.disconnect();
            console.log("Disconnected");
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
        document.getElementById("robotShow")?.classList.remove("robotShow_connected");
    }

    // 🎮 Button Handling
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

    document.querySelectorAll(".btn").forEach(button => {
        button.addEventListener("mousedown", () => {
            const command = buttonMap[button.classList[1]];
            if (command) sendUART(command);
        });

        button.addEventListener("mouseup", () => {
            sendUART("STOP");
        });
    });

    // 🎚 Slider Handling
    document.querySelector(".left-slider").addEventListener("input", event => {
        sendUART(`L_${event.target.value}`);
    });

    document.querySelector(".right-slider").addEventListener("input", event => {
        sendUART(`R_${event.target.value}`);
    });
});

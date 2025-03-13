document.addEventListener("DOMContentLoaded", function () {
    let uBitDevice;
    let rxCharacteristic;
    let txCharacteristic;

    document.getElementById("connectBtn").addEventListener("click", connectMicrobit);

    async function connectMicrobit() {
        try {
            console.log("Requesting Bluetooth Device...");
            uBitDevice = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: "BBC micro:bit" }],
                optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"]
            });

            console.log("Connecting to GATT Server...");
            await connectToGattServer();

        } catch (error) {
            console.error("Connection failed:", error);
        }
    }

    async function connectToGattServer() {
        try {
            if (!uBitDevice) return;
            const server = await uBitDevice.gatt.connect();

            console.log("Getting Service...");
            const service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");

            console.log("Getting Characteristics...");
            txCharacteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
            rxCharacteristic = await service.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca9e");

            console.log("Bluetooth Connection Successful");

            updateConnectionStatus(true);

            // Enable Notifications
            txCharacteristic.startNotifications();
            txCharacteristic.addEventListener("characteristicvaluechanged", onTxCharacteristicValueChanged);

            uBitDevice.addEventListener('gattserverdisconnected', reconnectMicrobit);

        } catch (error) {
            console.error("GATT Connection Failed:", error);
            updateConnectionStatus(false);
        }
    }

    function updateConnectionStatus(connected) {
        const connectBtn = document.getElementById("connectBtn");
        if (connected) {
            connectBtn.innerText = "Connected!";
            connectBtn.style.background = "#0077ff";
        } else {
            connectBtn.innerText = "Reconnect";
            connectBtn.style.background = "#ff3333";
        }
    }

    async function reconnectMicrobit() {
        console.log("Micro:bit disconnected. Attempting to reconnect...");
        updateConnectionStatus(false);

        // Wait 3 seconds before retrying
        setTimeout(async () => {
            if (uBitDevice) {
                try {
                    console.log("Reconnecting...");
                    await connectToGattServer();
                    console.log("Reconnected!");
                    updateConnectionStatus(true);
                } catch (error) {
                    console.error("Reconnect failed:", error);
                }
            }
        }, 3000);
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

    // 🎮 Button Handling - Improved for Mobile
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
        button.addEventListener("touchstart", e => e.preventDefault(), { passive: false });

        function sendStartCommand() {
            const command = buttonMap[button.classList[1]];
            if (command) sendUART(command);
        }

        function sendStopCommand() {
            sendUART("STOP");
        }

        button.addEventListener("touchstart", sendStartCommand);
        button.addEventListener("touchend", sendStopCommand);
        button.addEventListener("touchcancel", sendStopCommand);

        button.addEventListener("mousedown", sendStartCommand);
        button.addEventListener("mouseup", sendStopCommand);
        button.addEventListener("mouseleave", sendStopCommand);
    });

    // 🎚 Slider Handling - Improved with Debounce
    let sliderTimeout;
    function handleSliderInput(slider, prefix) {
        clearTimeout(sliderTimeout);
        sliderTimeout = setTimeout(() => {
            sendUART(`${prefix}_${slider.value}`);
        }, 100);
    }

    document.querySelector(".left-slider").addEventListener("input", event => {
        handleSliderInput(event.target, "L");
    });

    document.querySelector(".right-slider").addEventListener("input", event => {
        handleSliderInput(event.target, "R");
    });
});

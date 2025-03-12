document.addEventListener("DOMContentLoaded", function () {
    // Enable Full-Screen Mode on Connection
    function enableFullScreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { 
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { 
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { 
            document.documentElement.msRequestFullscreen();
        }
    }

    // Bluetooth Micro:bit Connection
    const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
    const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

    let uBitDevice;
    let rxCharacteristic;

    async function connectMicrobit() {
        try {
            enableFullScreen(); // Enter full-screen mode when connecting

            console.log("Requesting Bluetooth Device...");
            uBitDevice = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: "BBC micro:bit" }],
                optionalServices: [UART_SERVICE_UUID]
            });

            uBitDevice.addEventListener('gattserverdisconnected', onDisconnected);

            console.log("Connecting to GATT Server...");
            const server = await uBitDevice.gatt.connect();

            console.log("Getting Service...");
            const service = await server.getPrimaryService(UART_SERVICE_UUID);

            console.log("Getting Characteristics...");
            const txCharacteristic = await service.getCharacteristic(UART_TX_CHARACTERISTIC_UUID);
            txCharacteristic.startNotifications();
            txCharacteristic.addEventListener("characteristicvaluechanged", onTxCharacteristicValueChanged);

            rxCharacteristic = await service.getCharacteristic(UART_RX_CHARACTERISTIC_UUID);
            console.log("Micro:bit Connected!");

            document.getElementById('robotShow').classList.add("robotShow_connected");
        } catch (error) {
            console.log("Connection failed:", error);
        }
    }

    function disconnectMicrobit() {
        if (!uBitDevice) return;

        if (uBitDevice.gatt.connected) {
            uBitDevice.gatt.disconnect();
            console.log("Disconnected from Micro:bit");
        }
    }

    function onDisconnected(event) {
        console.warn("Micro:bit Disconnected");
        document.getElementById('robotShow').classList.remove("robotShow_connected");
    }

    async function sendUART(data) {
        if (!rxCharacteristic) {
            console.warn("Not connected to micro:bit.");
            return;
        }
        try {
            let encoder = new TextEncoder();
            await rxCharacteristic.writeValue(encoder.encode(data + "\n"));
            console.log("Sent:", data);
        } catch (error) {
            console.error("Error sending data:", error);
        }
    }

    function onTxCharacteristicValueChanged(event) {
        let receivedData = [];
        for (let i = 0; i < event.target.value.byteLength; i++) {
            receivedData[i] = event.target.value.getUint8(i);
        }
        const receivedString = String.fromCharCode.apply(null, receivedData);
        console.log("Received from micro:bit:", receivedString);
    }

    document.getElementById("connectBtn").addEventListener("click", connectMicrobit);
    document.getElementById("disconnectBtn").addEventListener("click", disconnectMicrobit);

    // Button Mapping for Micro:bit Commands
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

    // Handle D-Pad & Action Button Presses
    document.querySelectorAll(".dpad button, .buttons button").forEach(button => {
        button.addEventListener("mousedown", function () {
            let command = buttonMap[this.classList[1]] || "UNKNOWN";
            console.log(command);
            sendUART(command);
        });

        button.addEventListener("mouseup", function () {
            console.log("STOP");
            sendUART("STOP");
        });
    });

    // Handle Slider Input
    document.querySelectorAll(".slider").forEach(slider => {
        slider.addEventListener("input", function () {
            let command = this.classList.contains("left-slider") ? `L_${this.value}` : `R_${this.value}`;
            console.log(command);
            sendUART(command);
        });
    });

    // Prevent Scrolling on Mobile
    window.addEventListener("touchmove", function (event) {
        event.preventDefault();
    }, { passive: false });
});

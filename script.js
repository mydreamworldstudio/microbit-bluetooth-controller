document.addEventListener("DOMContentLoaded", function () {
    let device, server, service, txCharacteristic, rxCharacteristic;
    let isSending = false; // Prevent multiple send operations
    let isConnecting = false; // Prevent multiple connection attempts

    // Ensure Bluetooth connection is triggered by user gesture
    document.getElementById("connectBtn").addEventListener("click", connectMicrobit);

    async function connectMicrobit() {
        if (isConnecting) return; // Prevent multiple connection attempts
        isConnecting = true;

        try {
            console.log("Requesting Bluetooth Device...");
            device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: "BBC micro:bit" }],
                optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] // UART service
            });

            console.log("Connected to:", device.name);

            // Connect to GATT Server
            server = await device.gatt.connect();
            console.log("Connected to GATT Server");

            // Get the UART Service
            service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");

            // Get RX & TX Characteristics
            txCharacteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
            rxCharacteristic = await service.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca9e");

            // Enable notifications for receiving data
            rxCharacteristic.addEventListener("characteristicvaluechanged", onRxCharacteristicValueChanged);
            await rxCharacteristic.startNotifications();

            console.log("Bluetooth Connection Successful");
        } catch (error) {
            console.error("Connection failed:", error);
        } finally {
            isConnecting = false; // Allow reconnection if failed
        }
    }

    function onRxCharacteristicValueChanged(event) {
        let value = new TextDecoder().decode(event.target.value);
        console.log("Received:", value);
    }

    async function sendData(data) {
        if (isSending || !txCharacteristic) return; // Ignore if busy or not connected

        try {
            isSending = true; // Lock sending
            let encoder = new TextEncoder();
            await txCharacteristic.writeValue(encoder.encode(data));
            console.log("Sent:", data);
        } catch (error) {
            console.error("Error sending data:", error);
        } finally {
            isSending = false; // Unlock sending
        }
    }

    // 🎮 D-Pad Buttons
    document.querySelectorAll(".dpad button").forEach(button => {
        button.addEventListener("touchstart", () => handlePress(button));
        button.addEventListener("touchend", () => handleRelease());
    });

    // 🎮 Action Buttons
    document.querySelectorAll(".buttons button").forEach(button => {
        button.addEventListener("touchstart", () => handlePress(button));
        button.addEventListener("touchend", () => handleRelease());
    });

    // 🕹 Sliders
    document.querySelector(".left-slider").addEventListener("input", (e) => {
        sendData("L_" + e.target.value);
    });

    document.querySelector(".right-slider").addEventListener("input", (e) => {
        sendData("R_" + e.target.value);
    });

    function handlePress(button) {
        let action = button.classList[1]; // Get button class name
        let actionMap = {
            "dpad-up": "UP",
            "dpad-down": "DOWN",
            "dpad-left": "LEFT",
            "dpad-right": "RIGHT",
            "triangle": "TRIANGLE",
            "square": "SQUARE",
            "circle": "CIRCLE",
            "cross": "X"
        };
        sendData(actionMap[action] || "UNKNOWN");
    }

    function handleRelease() {
        sendData("STOP");
    }
});

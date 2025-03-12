document.addEventListener("DOMContentLoaded", function () {
    const connectBtn = document.getElementById("connectBtn");
    let uBitDevice, rxCharacteristic;

    // Fullscreen Mode Activation
    document.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting fullscreen: ${err.message}`);
            });
        }
    });

    connectBtn.addEventListener("click", connectMicrobit);

    async function connectMicrobit() {
        try {
            console.log("Requesting Bluetooth Device...");
            uBitDevice = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: "BBC micro:bit" }],
                optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"]
            });

            console.log("Connected to:", uBitDevice.name);
            uBitDevice.addEventListener("gattserverdisconnected", onDisconnected);

            // Connect to GATT Server
            const server = await uBitDevice.gatt.connect();
            console.log("Connected to GATT Server");

            // Get the UART Service
            const service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");

            // Get TX & RX Characteristics
            const txCharacteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
            rxCharacteristic = await service.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca9e");

            // Enable Notifications for TX Characteristic
            txCharacteristic.startNotifications();
            txCharacteristic.addEventListener("characteristicvaluechanged", onTxCharacteristicValueChanged);

            console.log("Bluetooth Connection Successful");
        } catch (error) {
            console.error("Connection failed:", error);
        }
    }

    function onDisconnected(event) {
        console.log(`Device ${event.target.name} is disconnected.`);
    }

    function sendUART(data) {
        if (!rxCharacteristic) return;
        let encoder = new TextEncoder();
        rxCharacteristic.writeValue(encoder.encode(data + "\n"))
            .then(() => console.log(`Sent: ${data}`))
            .catch(error => console.error("Error sending data:", error));
    }

    // Button Press & Release
    document.querySelectorAll(".btn").forEach(button => {
        button.addEventListener("mousedown", () => {
            let command = getCommand(button.classList);
            if (command) sendUART(command);
        });

        button.addEventListener("mouseup", () => {
            sendUART("STOP");
        });
    });

    // Sliders
    document.querySelector(".left-slider").addEventListener("input", function () {
        sendUART("L_" + this.value);
    });

    document.querySelector(".right-slider").addEventListener("input", function () {
        sendUART("R_" + this.value);
    });

    function getCommand(classes) {
        if (classes.contains("dpad-up")) return "UP";
        if (classes.contains("dpad-down")) return "DOWN";
        if (classes.contains("dpad-left")) return "LEFT";
        if (classes.contains("dpad-right")) return "RIGHT";
        if (classes.contains("triangle")) return "TRIANGLE";
        if (classes.contains("square")) return "SQUARE";
        if (classes.contains("circle")) return "O";
        if (classes.contains("cross")) return "X";
        return null;
    }
});

document.getElementById("connectBtn").addEventListener("click", async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service']  // Placeholder service
        });
        console.log("Connected to:", device.name);
    } catch (error) {
        console.error("Bluetooth connection failed:", error);
    }
});

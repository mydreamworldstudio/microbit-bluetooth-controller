document.addEventListener("DOMContentLoaded", function () {
    // Request full-screen mode when the page loads (if allowed)
    function enableFullScreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { // Firefox
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari, Edge
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
        }
    }

    // Bluetooth Connection
    document.getElementById("connectBtn").addEventListener("click", async () => {
        try {
            enableFullScreen(); // Enter full-screen mode when connecting

            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service']  // Placeholder service
            });

            console.log("Connected to:", device.name);
        } catch (error) {
            console.error("Bluetooth connection failed:", error);
        }
    });

    // Handle D-Pad button presses
    document.querySelectorAll(".dpad button").forEach(button => {
        button.addEventListener("mousedown", function () {
            console.log("D-Pad Pressed:", this.classList[1]); // Logs which D-Pad button is pressed
        });

        button.addEventListener("mouseup", function () {
            console.log("D-Pad Released:", this.classList[1]);
        });
    });

    // Handle Action button presses
    document.querySelectorAll(".buttons button").forEach(button => {
        button.addEventListener("mousedown", function () {
            console.log("Action Button Pressed:", this.classList[1]); // Logs which action button is pressed
        });

        button.addEventListener("mouseup", function () {
            console.log("Action Button Released:", this.classList[1]);
        });
    });

    // Handle Slider Input
    document.querySelectorAll(".slider").forEach(slider => {
        slider.addEventListener("input", function () {
            console.log("Slider Moved:", this.classList.contains("left-slider") ? "Left" : "Right", "Value:", this.value);
        });
    });

    // Prevent scrolling (important for mobile)
    window.addEventListener("touchmove", function (event) {
        event.preventDefault();
    }, { passive: false });
});

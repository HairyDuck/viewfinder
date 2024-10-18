let images = [];
let currentIndex = 0;

// Function to load an image by index
function loadImage(index) {
    if (images.length > 0 && images[index]) {
        const imageElement = document.getElementById('current-image');
        const noImageMessage = document.getElementById('no-image');
        imageElement.src = images[index].imagePath;
        imageElement.classList.remove('hidden');
        noImageMessage.classList.add('hidden');
        updateToolbarState(); // Update navigation button states
    } else {
        // If no image is found, show the "no image" message
        const imageElement = document.getElementById('current-image');
        const noImageMessage = document.getElementById('no-image');
        imageElement.classList.add('hidden');
        noImageMessage.classList.remove('hidden');
    }
}

// Update the state of the toolbar buttons (Next/Previous)
function updateToolbarState() {
    document.getElementById('prev-btn').disabled = currentIndex === 0; // Disable if at the first image
    document.getElementById('next-btn').disabled = currentIndex === images.length - 1; // Disable if at the last image
}

// Handle Previous button click
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        loadImage(currentIndex);
    }
});

// Handle Next button click
document.getElementById('next-btn').addEventListener('click', () => {
    if (currentIndex < images.length - 1) {
        currentIndex++;
        loadImage(currentIndex);
    }
});

// Function to handle file drop events and send the file path to the main process
function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Add the dropped image to the images array
            images.push({ imagePath: e.target.result });
            currentIndex = images.length - 1; // Set current index to the newly added image
            loadImage(currentIndex); // Load the dropped image
        };
        reader.readAsDataURL(file);
    }
}

// Adding event listeners for drag-and-drop
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('drop', handleDrop);

// IPC Listener to load a single image
window.electronAPI.loadImage((filePath, folderImages) => {
    const startIndex = folderImages.findIndex(img => img.imagePath === filePath);
    images = folderImages; // Load all images from the folder
    currentIndex = startIndex;
    loadImage(currentIndex);
});

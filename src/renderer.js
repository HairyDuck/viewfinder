document.addEventListener('DOMContentLoaded', function () {
    const imageElement = document.getElementById('current-image');
    const noImageMessage = document.getElementById('no-image');
    let viewer = null;
    let images = [];
    let currentIndex = 0;

    // Initialize Viewer.js
    function initViewer() {
        if (!viewer) {
            viewer = new Viewer(imageElement, {
                inline: false,
                toolbar: false,  // Disable Viewer.js toolbar
                zoomable: true,   // Allow zoom via mouse wheel
                rotatable: false, // Disable rotation
                scalable: false,
                fullscreen: false,
                viewed() {
                    viewer.zoomTo(1); // Reset zoom when viewing a new image
                }
            });
        }
    }

    // Function to load an image by index
    function loadImage(index) {
        if (images.length > 0 && images[index]) {
            imageElement.src = images[index].imagePath;
            imageElement.classList.remove('hidden');
            noImageMessage.classList.add('hidden');
            viewer.update(); // Update Viewer.js
        } else {
            imageElement.classList.add('hidden');
            noImageMessage.classList.remove('hidden');
        }
        updateToolbarState(); // Update navigation button states
    }

    // Load images in the current folder (Prev/Next functionality)
    function loadImagesInFolder(imageList, startIndex) {
        images = imageList;
        currentIndex = startIndex || 0;
        loadImage(currentIndex);
        initViewer();
    }

    // Update the state of the toolbar buttons (Next/Previous)
    function updateToolbarState() {
        const prevButton = document.getElementById('prev-btn');
        const nextButton = document.getElementById('next-btn');

        // Disable buttons based on the current state
        prevButton.disabled = images.length === 0 || currentIndex === 0; // Disable if no images or at first image
        nextButton.disabled = images.length === 0 || currentIndex === images.length - 1; // Disable if no images or at last image
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

    // Handle keyboard arrow navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            if (currentIndex > 0) {
                currentIndex--;
                loadImage(currentIndex);
            }
        } else if (e.key === 'ArrowRight') {
            if (currentIndex < images.length - 1) {
                currentIndex++;
                loadImage(currentIndex);
            }
        }
    });

    // Mousewheel zoom functionality
    imageElement.addEventListener('wheel', (e) => {
        if (viewer) {
            if (e.deltaY < 0) {
                viewer.zoom(0.1); // Zoom in
            } else {
                viewer.zoom(-0.1); // Zoom out
            }
        }
    });

    // IPC Listener to load a single image
    window.electronAPI.loadImage((filePath, folderImages) => {
        const startIndex = folderImages.findIndex(img => img.imagePath === filePath);
        loadImagesInFolder(folderImages, startIndex);
    });

    // Function to handle file drop events
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
                updateToolbarState(); // Update button states
            };
            reader.readAsDataURL(file);
        }
    }

    // Adding event listeners for drag-and-drop
    document.addEventListener('dragover', (event) => event.preventDefault());
    document.addEventListener('drop', handleDrop);

    // Handle any errors sent from the main process
    window.electronAPI.onError((errorMessage) => {
        console.error('Error:', errorMessage);
        showError(errorMessage);
    });

    // Helper function to display errors
    function showError(message) {
        const errorModal = document.createElement('div');
        errorModal.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px;">
                ${message}
            </div>
        `;
        document.body.appendChild(errorModal);
        setTimeout(() => errorModal.remove(), 3000);
    }
});

// Get condo ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const condoId = urlParams.get('id');

// Variables for storing data
let currentCondo = null;
let currentUserReview = null;
let isLoadingMoreReviews = false;
let currentPage = 1;
let hasMoreReviews = true;

// Load condo data when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Condo page loaded, ID:', condoId);
    
    // Initialize authentication UI
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    
    if (!condoId) {
        showError('No condo ID provided. Please select a condo from the listings.');
        return;
    }
    
    try {
        // Load condo details
        await loadCondoDetails();
        
        // Check if user has already reviewed this condo
        await checkUserReview();
        
        // Now load reviews for this condo
        await loadCondoReviews();
        
        // Setup review form submission if user is logged in
        setupReviewForm();
        
    } catch (error) {
        console.error('Error initializing condo page:', error);
        showError(error.message);
    }
});

// Load condo details from API
async function loadCondoDetails() {
    try {
        console.log('Fetching condo details for ID:', condoId);
        
        const response = await fetch(`${api.API_URL}/condos/${condoId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load condo details');
        }
        
        console.log('Condo data received:', data);
        
        // Store condo data
        currentCondo = data;
        
        // Update page content with condo details
        updateCondoDetails();
        
        // Hide loading indicator and show content
        document.getElementById('loadingIndicator').classList.add('d-none');
        document.getElementById('condoContent').classList.remove('d-none');
        
    } catch (error) {
        console.error('Error loading condo details:', error);
        document.getElementById('loadingIndicator').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error loading condo</h4>
                <p>${error.message}</p>
                <a href="condos.html" class="btn btn-success mt-3">Back to Condos</a>
            </div>
        `;
        throw error;
    }
}

// Check if user has already reviewed this condo
async function checkUserReview() {
    const token = localStorage.getItem('token');
    if (!token) return; // Not logged in
    
    try {
        const response = await fetch(`${api.API_URL}/reviews/user/condo/${condoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) return; // No review or error
        
        const data = await response.json();
        
        // This is important: if there's no review, we need to ensure currentUserReview is null
        currentUserReview = data.review || null;
        
        // Update the UI based on whether the user has a review or not
        updateUserReviewSection();
        
    } catch (error) {
        console.error('Error checking for user review:', error);
    }
}

// Update the user review section
function updateUserReviewSection() {
    const userReviewSection = document.getElementById('userReviewSection');
    const reviewFormSection = document.getElementById('reviewFormSection');
    
    if (!currentUserReview) {
        // No review, hide user review section and show form
        userReviewSection.classList.add('d-none');
        reviewFormSection.classList.remove('d-none');
        return;
    }
    
    // Show user review section and hide form
    userReviewSection.classList.remove('d-none');
    reviewFormSection.classList.add('d-none');
    
    // Update user review content
    const userReviewImage = document.getElementById('userReviewImage');
    const userReviewUsername = document.getElementById('userReviewUsername');
    const userReviewStars = document.getElementById('userReviewStars');
    const userReviewDate = document.getElementById('userReviewDate');
    const userReviewComment = document.getElementById('userReviewComment');
    
    // Set profile pic
    if (currentUserReview.user && currentUserReview.user.profilePicture) {
        userReviewImage.src = currentUserReview.user.profilePicture;
    } else {
        userReviewImage.src = '../images/anonymous.png';
    }
    
    // Set username
    if (currentUserReview.user && currentUserReview.user.username) {
        userReviewUsername.textContent = currentUserReview.user.username;
    } else {
        userReviewUsername.textContent = 'You';
    }
    
    // Set stars
    userReviewStars.innerHTML = generateStarRating(currentUserReview.rating);
    
    // Set date
    const reviewDate = new Date(currentUserReview.datePosted);
    userReviewDate.textContent = calculateTimeAgo(reviewDate);
    
    // Set comment
    userReviewComment.textContent = currentUserReview.comment || 'No comment provided.';
    
    // IMPORTANT: Remove any existing event listeners to prevent duplicates
    const editButton = document.getElementById('editReviewBtn');
    const deleteButton = document.getElementById('deleteReviewBtn');
    
    // Clone and replace to remove old event listeners
    const newEditButton = editButton.cloneNode(true);
    const newDeleteButton = deleteButton.cloneNode(true);
    
    // FIX: Explicitly reset button appearance before adding to DOM
    newEditButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
    newEditButton.disabled = false;
    newDeleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
    newDeleteButton.disabled = false;
    
    editButton.parentNode.replaceChild(newEditButton, editButton);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
    
    // Set up edit button
    newEditButton.addEventListener('click', function() {
        // Switch to edit mode
        userReviewSection.classList.add('d-none');
        reviewFormSection.classList.remove('d-none');
        
        // Pre-fill the form with existing review data
        const ratingRadio = document.querySelector(`input[name="rating"][value="${currentUserReview.rating}"]`);
        if (ratingRadio) ratingRadio.checked = true;
        
        document.getElementById('reviewComment').value = currentUserReview.comment || '';
        
        // Change button text to indicate editing
        const submitButton = document.getElementById('reviewSubmitBtn');
        if (submitButton) submitButton.textContent = 'Update Review';
    });
    
    // Set up delete button
    newDeleteButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete your review? This cannot be undone.')) {
            deleteReview();
        }
    });
}

// Update UI with condo details
function updateCondoDetails() {
    console.log('Updating UI with condo data');
    
    // Set page title
    document.title = `${currentCondo.name} - TaftLivin'`;
    
    // Update condo name
    const titleElement = document.querySelector('h3.fw-bold');
    if (titleElement) titleElement.textContent = currentCondo.name;
    
    // Update main image
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        const imageSrc = currentCondo.image || '../images/green1.jpg';
        mainImage.src = imageSrc;
        mainImage.setAttribute('onclick', `openPopup('${imageSrc}')`);
    }
    
    // Update address
    const addressElement = document.getElementById('condoAddress');
    if (addressElement && currentCondo.address) {
        // Create a flex container for address and distance
        const addressContainer = document.createElement('div');
        addressContainer.className = 'd-flex justify-content-between align-items-center mb-2';
        
        // Create address span
        const addressSpan = document.createElement('span');
        addressSpan.textContent = currentCondo.address;
        
        // Create distance span
        const distance = currentCondo.distance || 150; // Default to 150m if not specified
        const walkingTimeMinutes = calculateWalkingTime(distance);
        const distanceSpan = document.createElement('span');
        distanceSpan.className = 'text-dark ms-3';
        distanceSpan.innerHTML = `<i class="fas fa-walking me-1"></i> ${distance}m (${walkingTimeMinutes}min. walk)`;
        
        // Add both to the container
        addressContainer.appendChild(addressSpan);
        addressContainer.appendChild(distanceSpan);
        
        // Replace the address element with our container
        addressElement.parentNode.replaceChild(addressContainer, addressElement);
    }
    
    // Update rating display
    const ratingElement = document.getElementById('condoRating');
    if (ratingElement) {
      const rating = currentCondo.averageRating || 0;
      const reviewCount = currentCondo.reviewCount || 0;
      
      // Use the same star rating format as condos.html
      const starsHtml = generateStarRating(rating);
      ratingElement.innerHTML = `${starsHtml} <span class="ms-2 text-secondary">(${reviewCount} reviews)</span>`;
      
      // Add console log for debugging
      console.log(`Updating UI: Rating=${rating}, ReviewCount=${reviewCount}`);
    }
    
    // Update description
    const descriptionElement = document.getElementById('condoDescription');
    if (descriptionElement) {
        descriptionElement.textContent = currentCondo.description || 'No description available.';
    }
    
    // Update amenities list
    const amenitiesElement = document.getElementById('condoAmenities');
    if (amenitiesElement && currentCondo.amenities && currentCondo.amenities.length > 0) {
        amenitiesElement.innerHTML = '';
        
        currentCondo.amenities.forEach(amenity => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>${amenity}`;
            amenitiesElement.appendChild(li);
        });
    } else if (amenitiesElement) {
        amenitiesElement.innerHTML = '<li class="list-group-item">No amenities listed</li>';
    }
}


// Load reviews for this condo with infinite scroll
async function loadCondoReviews(page = 1, append = false) {
    try {
        console.log('Loading reviews for condo:', condoId, 'Page:', page);
        
        const reviewsContainer = document.querySelector('.reviews-container');
        if (!reviewsContainer) {
            console.error('No reviews container found');
            return;
        }
        
        // If we're already loading more reviews, exit
        if (isLoadingMoreReviews) return;
        isLoadingMoreReviews = true;
        
        // Show loading state
        if (!append) {
            // First load, replace container content with loading indicator
            reviewsContainer.innerHTML = `
                <div class="text-center py-3" id="reviewsLoadingIndicator">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Loading reviews...</span>
                    </div>
                    <p class="mt-2">Loading reviews...</p>
                </div>
            `;
        } else {
            // Append mode, add loading indicator at bottom
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'moreReviewsLoading';
            loadingIndicator.classList.add('text-center', 'py-3');
            loadingIndicator.innerHTML = `
                <div class="spinner-border spinner-border-sm text-success" role="status">
                    <span class="visually-hidden">Loading more...</span>
                </div>
                <p class="mt-2 small">Loading more reviews...</p>
            `;
            reviewsContainer.appendChild(loadingIndicator);
        }
        
        // Fetch reviews from API - limit to 5 per page for better UX
        const response = await fetch(`${api.API_URL}/reviews/condo/${condoId}?page=${page}&limit=5`);
        console.log('Reviews API response status:', response.status);
        const data = await response.json();
        console.log('Reviews data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load reviews');
        }
        
        // Remove loading indicators
        if (append) {
            const moreLoading = document.getElementById('moreReviewsLoading');
            if (moreLoading) moreLoading.remove();
        } else {
            reviewsContainer.innerHTML = '';
        }
        
        // Check if we have more pages
        hasMoreReviews = data.page < data.pages;
        currentPage = data.page;
        
        // Display reviews
        if (!data.reviews || data.reviews.length === 0) {
            if (!append) {
                reviewsContainer.innerHTML = '<p class="text-muted">No reviews yet. Be the first to leave a review!</p>';
            }
            hasMoreReviews = false;
            isLoadingMoreReviews = false;
            return;
        }
        
        // Filter out user's review if it exists and this is the first page
        // (since we're already showing it at the top)
        let reviewsToShow = data.reviews;
        if (currentUserReview && !append) {
            reviewsToShow = data.reviews.filter(review => 
                review._id !== currentUserReview._id
            );
        }
        
        // Add each review
        reviewsToShow.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            
            // Format date
            const reviewDate = new Date(review.datePosted);
            const timeAgo = calculateTimeAgo(reviewDate);
            
            // Generate star rating HTML
            const starsHtml = generateStarRating(review.rating);
            
            // Create review HTML
            reviewElement.innerHTML = `
                <img class="reviewer-img" src="${review.user?.profilePicture || '../images/anonymous.png'}" alt="profile pic" />
                <strong>${review.user?.username || 'Anonymous'}</strong>${review.location ? ` - ${review.location}` : ''}
                <p>${starsHtml}</p>
                <p>${timeAgo}</p>
                <p>${review.comment || 'No comment provided.'}</p>
            `;
            
            reviewsContainer.appendChild(reviewElement);
        });
        
        // Add a sentinel element for intersection observer
        // Remove old sentinel first if it exists
        const oldSentinel = document.getElementById('reviews-sentinel');
        if (oldSentinel) oldSentinel.remove();
        
        if (hasMoreReviews) {
            const sentinel = document.createElement('div');
            sentinel.id = 'reviews-sentinel';
            sentinel.style.height = '10px';
            sentinel.style.marginTop = '10px';
            reviewsContainer.appendChild(sentinel);
            
            // Setup intersection observer for the new sentinel
            setupInfiniteScroll();
        }
        
        isLoadingMoreReviews = false;
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        const reviewsContainer = document.querySelector('.reviews-container');
        if (reviewsContainer) {
            if (!append) {
                reviewsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Error loading reviews: ${error.message}
                    </div>
                `;
            } else {
                const moreLoading = document.getElementById('moreReviewsLoading');
                if (moreLoading) {
                    moreLoading.innerHTML = `
                        <div class="alert alert-danger">
                            Failed to load more reviews. <a href="#" id="retry-more-reviews">Try again</a>
                        </div>
                    `;
                    document.getElementById('retry-more-reviews')?.addEventListener('click', (e) => {
                        e.preventDefault();
                        loadMoreReviews();
                    });
                }
            }
        }
        isLoadingMoreReviews = false;
    }
}

// Setup infinite scroll for reviews
function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && hasMoreReviews && !isLoadingMoreReviews) {
                console.log('Sentinel is visible, loading more reviews');
                loadMoreReviews();
            }
        });
    }, options);
    
    // Start observing the sentinel
    const sentinel = document.getElementById('reviews-sentinel');
    if (sentinel) {
        observer.observe(sentinel);
    }
}

// Load more reviews function
function loadMoreReviews() {
    if (isLoadingMoreReviews || !hasMoreReviews) return;
    
    const nextPage = currentPage + 1;
    loadCondoReviews(nextPage, true);
}

// Generate star rating display
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '<div class="d-inline-flex align-items-center">';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star text-warning"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star text-warning"></i>';
    }
    
    // Add numerical rating
    starsHtml += `<span class="ms-2 text-dark fw-bold">${rating.toFixed(1)}</span>`;
    starsHtml += '</div>';
    
    return starsHtml;
}

// Helper function to calculate time ago
function calculateTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000); // years
    if (interval >= 1) return interval + (interval === 1 ? ' year ago' : ' years ago');
    
    interval = Math.floor(seconds / 2592000); // months
    if (interval >= 1) return interval + (interval === 1 ? ' month ago' : ' months ago');
    
    interval = Math.floor(seconds / 86400); // days
    if (interval >= 1) return interval + (interval === 1 ? ' day ago' : ' days ago');
    
    interval = Math.floor(seconds / 3600); // hours
    if (interval >= 1) return interval + (interval === 1 ? ' hour ago' : ' hours ago');
    
    interval = Math.floor(seconds / 60); // minutes
    if (interval >= 1) return interval + (interval === 1 ? ' minute ago' : ' minutes ago');
    
    return 'just now';
}

// Setup review form submission
// Update this function in condo-page.js
function setupReviewForm() {
    const token = localStorage.getItem('token');
    const reviewForm = document.getElementById('reviewForm');
    
    if (!token) {
        console.log('No token found, user not logged in');
        return;
    }
    
    if (!reviewForm) {
        console.error('Review form element not found');
        return;
    }
    
    // Remove any existing event listeners
    const newForm = reviewForm.cloneNode(true);
    reviewForm.parentNode.replaceChild(newForm, reviewForm);
    
    console.log('Setting up review form submission');
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = newForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        const rating = newForm.querySelector('input[name="rating"]:checked')?.value;
        const comment = newForm.querySelector('#reviewComment').value;
        
        if (!rating) {
            showNotification('Error', 'Please select a rating', 'danger');
            return;
        }
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
            
            console.log('Submitting review:', { condoId, rating, comment });
            
            // Submit to backend API
            const response = await fetch(`${api.API_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    condoId,
                    rating: Number(rating),
                    comment
                })
            });
            
            const data = await response.json();
            console.log('Review submission response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }
            
            // Reset form
            newForm.reset();
            
            // Reset pagination variables
            currentPage = 1;
            hasMoreReviews = true;
            
            // Show success notification
            const isUpdate = !!currentUserReview;
            showNotification(
                'Success', 
                isUpdate ? 'Your review has been updated successfully!' : 'Your review has been submitted successfully!',
                'success'
            );
            
            // Update user review status (fetch the updated review)
            await checkUserReview();
            
            // Reload reviews from scratch and condo details
            await loadCondoReviews(1, false);
            await loadCondoDetails();
            
        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('Error', error.message, 'danger');
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

// Show notification toast
function showNotification(title, message, type = 'success') {
    const toastElement = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Set color based on type
    toastElement.className = 'toast';
    
    if (type === 'success') {
        toastElement.classList.add('bg-success', 'text-white');
    } else if (type === 'danger') {
        toastElement.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
        toastElement.classList.add('bg-warning');
    }
    
    // Configure toast options for auto-hide
    const toastOptions = {
        animation: true,
        autohide: true,
        delay: 5000 // 5 seconds
    };
    
    // Create Bootstrap Toast instance with options and show it
    const toast = new bootstrap.Toast(toastElement, toastOptions);
    toast.show();
}

// Show error message on page
function showError(message) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error</h4>
                <p>${message}</p>
                <a href="condos.html" class="btn btn-success mt-3">Back to Condos</a>
            </div>
        `;
    } else {
        showNotification('Error', message, 'danger');
    }
}

// Function to delete the current user's review
async function deleteReview() {
    const token = localStorage.getItem('token');
    if (!token || !currentUserReview) return;
    
    try {
        // Show loading state
        const deleteBtn = document.getElementById('deleteReviewBtn');
        const originalText = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        
        // Call API to delete the review
        const response = await fetch(`${api.API_URL}/reviews/${currentUserReview._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete review');
        }
        
        console.log('Delete review response:', data);
        
        // Show success notification
        showNotification('Success', 'Your review has been deleted successfully', 'success');
        
        // Update condo data with the returned values to avoid an extra API call
        if (data.updatedCondo && currentCondo) {
            currentCondo.averageRating = data.updatedCondo.averageRating;
            currentCondo.reviewCount = data.updatedCondo.reviewCount;
            // Update the UI with these new values
            const ratingElement = document.getElementById('condoRating');
            if (ratingElement) {
                const starsHtml = generateStarRating(currentCondo.averageRating);
                ratingElement.innerHTML = `${starsHtml} <span class="ms-2 text-secondary">(${currentCondo.reviewCount} reviews)</span>`;
            }
        }
        
        // Clear current user review
        currentUserReview = null;
        
        // Show the review form instead
        updateUserReviewSection();
        
        // Reset the form
        document.getElementById('reviewForm').reset();
        document.getElementById('reviewSubmitBtn').textContent = 'Submit Review';
        
        // Reload reviews to show the updated list
        await loadCondoReviews(1, false);
        
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Error', error.message, 'danger');
    } finally {
        // Always restore delete button, even on error
        const deleteBtn = document.getElementById('deleteReviewBtn');
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
    }
}

function calculateWalkingTime(meters) {
    // Average walking speed is about 1.4 meters per second or 84 meters per minute
    const walkingSpeedMetersPerMinute = 84;
    // Calculate minutes and round to nearest integer
    return Math.round(meters / walkingSpeedMetersPerMinute);
}





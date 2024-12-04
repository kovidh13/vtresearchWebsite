// Client/postOpportunity.js

document.addEventListener('DOMContentLoaded', function() {
    // Ensure the user is a professor
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to access this page.');
      window.location.href = 'login.html';
      return;
    }
  
    const user = getUserFromToken(); // Now accessible globally
  
    if (user.role !== 'professor') {
      alert('Access denied. Only professors can post new opportunities.');
      window.location.href = 'researchIndex.html';
      return;
    }
  
    // Handle form submission
    const form = document.getElementById('post-opportunity-form');
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
  
      const title = document.getElementById('opportunity-title').value.trim();
      const description = document.getElementById('opportunity-description').value.trim();
      const fullDescription = document.getElementById('opportunity-full-description').value.trim();
      const department = document.getElementById('opportunity-department').value.trim();
  
      const messageDiv = document.getElementById('post-opportunity-message');
      messageDiv.innerHTML = '';
  
      // Basic validation
      if (!title || !description || !fullDescription || !department) {
        messageDiv.innerHTML = '<p class="error">All fields are required.</p>';
        return;
      }
  
      try {
        const response = await fetch('/api/opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Include the JWT token
          },
          body: JSON.stringify({ title, description, fullDescription, department }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          messageDiv.innerHTML = '<p class="success">Opportunity posted successfully! Redirecting...</p>';
          // Redirect to the index page after a short delay
          setTimeout(() => {
            window.location.href = 'researchIndex.html';
          }, 2000);
        } else {
          messageDiv.innerHTML = `<p class="error">${data.message}</p>`;
        }
      } catch (error) {
        console.error('Error posting opportunity:', error);
        messageDiv.innerHTML = '<p class="error">An error occurred. Please try again later.</p>';
      }
    });
  });
  